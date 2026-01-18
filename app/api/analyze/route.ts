import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
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

    // Stage 1: Parse code with tree-sitter (local, no LLM)
    const { root, rawAST } = parseCode(code);

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
      .map((n) => `ID: ${n.id} | [${n.startPos}-${n.endPos}] "${n.code.substring(0, 40)}" | Type: ${n.nodeType} | General: ${n.generalMeaning}`)
      .join('\n');

    const meaningPrompt = buildMeaningPrompt(code, language, nodeListForLLM);
    const meaningResult = await model.generateContent(meaningPrompt);
    const meaningText = meaningResult.response.text();
    const meanings = parseMeaningResponse(meaningText);

    // Apply meanings to nodes
    const meaningsByNodeId = new Map(meanings.map((m) => [m.nodeId, { general: m.generalMeaning, contextual: m.contextualMeaning }]));
    applyMeaningsToTree(root, meaningsByNodeId);

    // Stage 3: Generate plain English translation
    const translationPrompt = buildTranslationPrompt(code, language, root);
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
  return `You are a semantic code analyzer. Given a ${language} code snippet and its AST nodes, provide TWO types of meanings for each node:

1. GENERAL MEANING: What this code fragment represents in the programming language, independent of any surrounding code (e.g., "for loop initialization", "variable declaration", "function call").

2. CONTEXTUAL MEANING: What this fragment specifically does or contributes within this complete code snippet (e.g., "initializes loop counter to iterate through array", "declares buffer size constant", "calls sort function on user list").

CODE:
\`\`\`${language}
${code}
\`\`\`

AST NODES:
${nodeList}

For each node ID, provide both meanings (each 1-2 sentences).

OUTPUT FORMAT:
Return a JSON object:
{
  "meanings": [
    {
      "nodeId": "node_0",
      "generalMeaning": "Language-level explanation of what this construct is",
      "contextualMeaning": "Specific explanation of what this does in this code"
    },
    ...
  ]
}

Return ONLY the JSON object, no additional text.`;
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
