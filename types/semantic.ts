// Type definitions for semantic analysis

export interface SemanticNode {
  id: string;
  code: string;
  startPos: number;
  endPos: number;
  generalMeaning: string;
  contextualMeaning: string;
  nodeType: 'elementary' | 'composite';
  tokenType?: 'identifier' | 'literal' | 'operator' | 'keyword' | 'delimiter';
  children: SemanticNode[];
}

export interface SemanticTree {
  root: SemanticNode;
  plainEnglishTranslation: string;
  language: string;
  rawTreeSitterAST?: string;
}

export interface AnalyzeRequest {
  code: string;
  language: string;
}

export interface AnalyzeResponse {
  success: boolean;
  data?: SemanticTree;
  error?: string;
}
