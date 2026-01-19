import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { execFileSync } from 'child_process';
import type { AnalyzeRequest, AnalyzeResponse, SemanticTree } from '@/types/semantic';
import { parseCode, flattenTree } from '@/app/lib/parser';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json();
    const { code, language } = body;

    if (!code || !language) {
      return NextResponse.json<AnalyzeResponse>({
        success: false,
        error: 'Code and language are required',
      }, { status: 400 });
    }

    // Optional: normalize formatting for C++ before parsing
    const normalizedCode = formatCodeIfSupported(code, language);

    // Stage 1: Parse code with tree-sitter (local, no LLM)
    const { root, rawAST } = parseCode(normalizedCode);

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
      }
    });

    // Stage 2: Add contextual meanings to all nodes (single LLM call)
    const allNodes = flattenTree(root);
    const nodeListForLLM = allNodes
      .map((n) => {
        // For elementary nodes (identifiers, keywords, literals), show full code
        // For composite nodes, truncate to 60 chars but preserve identifier names
        let displayCode = n.code;
        if (n.nodeType === 'composite' && displayCode.length > 60) {
          displayCode = displayCode.substring(0, 60) + '...';
        }
        return `ID: ${n.id} | [${n.startPos}-${n.endPos}] "${displayCode}" | Type: ${n.nodeType} | General: ${n.generalMeaning}`;
      })
      .join('\n');

    const meaningPrompt = buildMeaningPrompt(normalizedCode, language, nodeListForLLM);
    const meaningResult = await model.generateContent(meaningPrompt);
    const meaningText = meaningResult.response.text();
    const meanings = parseMeaningResponse(meaningText);

    // Apply meanings to nodes
    const meaningsByNodeId = new Map(meanings.map((m) => [m.nodeId, { general: m.generalMeaning, contextual: m.contextualMeaning }]));
    applyMeaningsToTree(root, meaningsByNodeId);

    // Stage 3: Generate plain English translation
    const translationPrompt = buildTranslationPrompt(normalizedCode, language, root);
    const translationResult = await model.generateContent(translationPrompt);
    const translationText = translationResult.response.text();
    const translation = parseTranslationResponse(translationText);

    const semanticTree: SemanticTree = {
      root,
      plainEnglishTranslation: translation,
      language,
      rawTreeSitterAST: rawAST,
    };

    return NextResponse.json<AnalyzeResponse>({
      success: true,
      data: semanticTree,
    });
  } catch (error) {
    console.error('Error analyzing code:', error);
    return NextResponse.json<AnalyzeResponse>({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }, { status: 500 });
  }
}

function buildMeaningPrompt(code: string, language: string, nodeList: string): string {
  return `You are a formal semantic analyzer.

The code below has already been parsed using Tree-sitter. Each entry represents ONE Tree-sitter node.
You MUST NOT invent any structure or meaning beyond what is implied by the node type and code span.

For EACH node, provide EXACTLY TWO meanings:

1. GENERAL MEANING
- Describe what this Tree-sitter node type represents in the ${language} language specification.
- This MUST be context-independent.
- Focus on syntactic and semantic role (not intent, not usage).
- Example: "binary expression", "variable declarator", "function call expression".

2. CONTEXTUAL MEANING
- Describe what this node contributes SPECIFICALLY within THIS code snippet.
- Assume all child nodes have already been explained.
- Do NOT restate child behavior.
- Describe ONLY the additional role this node plays when composed with its children.

STRICT RULES:
- Do NOT repeat explanations across nodes.
- Do NOT summarize the entire program except for the root node.
- Do NOT use informal language, metaphors, or stylistic commentary.
- Each node must be explained EXACTLY ONCE.
- Meanings must be concise (1–2 sentences max per field).
- Use only information visible in the code and node type.

CODE (${language}):
\`\`\`${language}
${code}
\`\`\`

TREE-SITTER NODES (authoritative):
${nodeList}

OUTPUT FORMAT (JSON ONLY):
{
  "meanings": [
    {
      "nodeId": "node_0",
      "generalMeaning": "...",
      "contextualMeaning": "..."
    }
  ]
}

Return ONLY valid JSON. No markdown. No commentary.`;
}

interface MeaningEntry {
  nodeId: string;
  generalMeaning: string;
  contextualMeaning: string;
}

function parseMeaningResponse(text: string): MeaningEntry[] {
  let cleanedText = text.trim();
  if (cleanedText.startsWith('```json')) cleanedText = cleanedText.slice(7);
  else if (cleanedText.startsWith('```')) cleanedText = cleanedText.slice(3);
  if (cleanedText.endsWith('```')) cleanedText = cleanedText.slice(0, -3);
  cleanedText = cleanedText.trim();

  try {
    const parsed = JSON.parse(cleanedText);
    if (!Array.isArray(parsed.meanings)) {
      throw new Error('Invalid response: meanings is not an array');
    }
    return parsed.meanings;
  } catch (error) {
    console.error('Failed to parse meaning response:', cleanedText.substring(0, 500));
    return [];
  }
}

function applyMeaningsToTree(node: any, meanings: Map<string, { general: string; contextual: string }>): void {
  if (meanings.has(node.id)) {
    const meaning = meanings.get(node.id);
    if (meaning) {
      node.generalMeaning = meaning.general || node.generalMeaning;
      node.contextualMeaning = meaning.contextual || '';
    }
  }
  for (const child of node.children) {
    applyMeaningsToTree(child, meanings);
  }
}

function buildTranslationPrompt(code: string, language: string, root: any): string {
  return `Provide a brief (1-2 sentences) plain English translation of this ${language} code:

\`\`\`${language}
${code}
\`\`\`

Return ONLY the translation text, no JSON or additional formatting.`;
}

function parseTranslationResponse(text: string): string {
  return text.trim();
}

function formatCodeIfSupported(code: string, language: string): string {
  const lang = language.toLowerCase();
  const isCpp = lang.includes('c++') || lang === 'cpp' || lang === 'cxx' || lang.includes('cpp');
  if (!isCpp) return code;

  try {
    // Use clang-format if available; fallback to original on error
    const output = execFileSync(
      'clang-format',
      ['-assume-filename=code.cpp', '-style=LLVM'],
      { input: code, maxBuffer: 5 * 1024 * 1024 }
    );
    return output.toString();
  } catch (err) {
    console.warn('clang-format not available or failed; using original code');
    return code;
  }
}
