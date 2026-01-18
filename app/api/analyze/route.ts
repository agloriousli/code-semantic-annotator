import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AnalyzeRequest, AnalyzeResponse, SemanticTree } from '@/types/semantic';

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

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = buildSemanticAnalysisPrompt(code, language);
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Parse the JSON response from Gemini
    const semanticTree = parseGeminiResponse(text);

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

function buildSemanticAnalysisPrompt(code: string, language: string): string {
  return `You are a semantic code analyzer. Perform a recursive, bottom-up semantic decomposition of the following ${language} code snippet.

INSTRUCTIONS:

Step 1 — Decomposition
- Recursively partition the code according to its abstract syntax structure
- Continue until each part is an elementary unit (lexical token: identifier, literal, operator, keyword, or delimiter)

Step 2 — Explanation
- Starting from elementary units and proceeding bottom-up, explain each part exactly once
- For every part (elementary or composite), provide:
  * General meaning: What this code fragment represents in ${language}, independent of context
  * Contextual meaning: What this fragment specifically does within this code snippet

Step 3 — Composition
- Combine explained parts into larger syntactic and semantic units
- When explaining composite units, use the already generated explanations of child units
- Continue until the full code snippet is explained

CONSTRAINTS:
- Follow strict bottom-up order
- Do not skip intermediate constructs
- Avoid redundancy or informal descriptions
- Explanations must reflect formal programming language semantics, not style

OUTPUT FORMAT:
Return a JSON object with this structure:
{
  "root": {
    "id": "unique_id",
    "code": "the code fragment",
    "startPos": 0,
    "endPos": 10,
    "generalMeaning": "language-level semantics",
    "contextualMeaning": "role in this specific code",
    "nodeType": "elementary" or "composite",
    "tokenType": "identifier|literal|operator|keyword|delimiter" (only for elementary nodes),
    "children": [array of child nodes with same structure]
  },
  "plainEnglishTranslation": "literal translation of entire code",
  "language": "${language}"
}

Each node must have unique position ranges (startPos, endPos) relative to the original code.
Elementary nodes have no children (empty array).
Composite nodes have children that represent their constituent parts.

CODE TO ANALYZE:
\`\`\`${language}
${code}
\`\`\`

Return ONLY the JSON object, no additional text.`;
}

function parseGeminiResponse(text: string): SemanticTree {
  // Remove markdown code blocks if present
  let cleanedText = text.trim();
  if (cleanedText.startsWith('```json')) {
    cleanedText = cleanedText.slice(7);
  } else if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.slice(3);
  }
  if (cleanedText.endsWith('```')) {
    cleanedText = cleanedText.slice(0, -3);
  }
  
  cleanedText = cleanedText.trim();
  
  try {
    const parsed = JSON.parse(cleanedText);
    return parsed as SemanticTree;
  } catch (error) {
    console.error('Failed to parse Gemini response:', cleanedText);
    throw new Error('Failed to parse semantic analysis response');
  }
}
