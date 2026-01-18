import Parser from 'tree-sitter';
import Cpp from 'tree-sitter-cpp';
import type { SemanticNode } from '@/types/semantic';

// Initialize parser once (singleton)
let parser: Parser | null = null;

function initParser(): Parser {
  if (!parser) {
    parser = new Parser();
    parser.setLanguage(Cpp);
  }
  return parser;
}

// Get semantic classification from node type
function classifyNodeType(nodeType: string): string {
  const keywordTypes = new Set([
    'primitive_type',
    'sized_type_specifier',
    'type_qualifier',
    'storage_class_specifier',
    'struct_specifier',
    'union_specifier',
    'enum_specifier',
    'class_specifier',
    'namespace_name',
    'type_definition',
  ]);

  const controlFlowTypes = new Set([
    'if_statement',
    'else_clause',
    'switch_statement',
    'case_statement',
    'default_statement',
    'while_statement',
    'do_statement',
    'for_statement',
    'for_range_loop',
    'break_statement',
    'continue_statement',
    'return_statement',
    'goto_statement',
    'labeled_statement',
  ]);

  const declarationTypes = new Set([
    'declaration',
    'function_definition',
    'parameter_declaration',
    'field_declaration',
    'template_declaration',
    'explicit_function_instantiation',
  ]);

  const expressionTypes = new Set([
    'binary_expression',
    'unary_expression',
    'call_expression',
    'field_expression',
    'pointer_expression',
    'subscript_expression',
    'conditional_expression',
    'assignment_expression',
    'cast_expression',
    'sizeof_expression',
  ]);

  if (keywordTypes.has(nodeType)) return 'keyword';
  if (controlFlowTypes.has(nodeType)) return 'control_flow';
  if (declarationTypes.has(nodeType)) return 'declaration';
  if (expressionTypes.has(nodeType)) return 'expression';
  if (nodeType === 'string_literal') return 'literal';
  if (nodeType === 'number_literal' || nodeType === 'char_literal') return 'literal';
  if (nodeType === 'identifier') return 'identifier';
  if (nodeType === 'operator' || nodeType.includes('operator')) return 'operator';
  if (nodeType === '(' || nodeType === ')' || nodeType === '{' || nodeType === '}' || nodeType === '[' || nodeType === ']' || nodeType === ';' || nodeType === ',') return 'delimiter';
  return 'other';
}

// Determine if a node should be collapsed (trivial wrapper)
function shouldCollapse(node: Parser.SyntaxNode): boolean {
  const collapseTypes = new Set([
    'translation_unit_declaration',
    'declaration_list',
    'block_item_list',
    'init_declarator_list',
    'parameter_list',
    'argument_list',
    'enumerator_list',
    'field_declaration_list',
    'base_class_clause',
    'access_specifier',
    'template_parameter_list',
    'template_argument_list',
    'qualified_identifier',
    'pointer_declarator',
    'abstract_pointer_declarator',
    'array_declarator',
    'abstract_array_declarator',
    'function_declarator',
    'abstract_function_declarator',
    'attributed_declarator',
    'parenthesized_declarator',
    'type_definition',
    'typedef_name',
  ]);

  // Don't collapse if it has meaningful structure
  if (node.childCount === 0) return false;
  if (node.childCount === 1) return collapseTypes.has(node.type) || node.type.includes('_list');
  return false;
}

// Recursively simplify AST
function simplifyNode(node: Parser.SyntaxNode, code: string): Parser.SyntaxNode | null {
  // Skip whitespace-only nodes
  if (node.type === 'comment' || node.type === 'preproc') {
    return null;
  }

  // If this node should be collapsed and has one meaningful child, recurse
  if (shouldCollapse(node) && node.childCount === 1) {
    return simplifyNode(node.child(0)!, code);
  }

  // If empty compound statement or similar, skip
  if (node.childCount === 0 && node.type.includes('statement')) {
    return null;
  }

  return node;
}

// Convert simplified AST node to SemanticNode
function astNodeToSemanticNode(
  node: Parser.SyntaxNode,
  code: string,
  idCounter: { value: number }
): SemanticNode | null {
  // Skip empty nodes
  if (node.startIndex === node.endIndex) {
    return null;
  }

  const nodeId = `node_${idCounter.value++}`;
  const nodeCode = code.substring(node.startIndex, node.endIndex);
  const classification = classifyNodeType(node.type);

  // Recursively convert children
  const childrenTemp: SemanticNode[] = [];
  for (let i = 0; i < node.childCount; i++) {
    const child = node.child(i);
    if (child) {
      const simplified = simplifyNode(child, code);
      if (simplified) {
        const childNode = astNodeToSemanticNode(simplified, code, idCounter);
        if (childNode) {
          childrenTemp.push(childNode);
        }
      }
    }
  }

  // Determine if this is elementary (leaf) or composite
  const isElementary = childrenTemp.length === 0 && node.childCount <= 1;

  return {
    id: nodeId,
    code: nodeCode,
    startPos: node.startIndex,
    endPos: node.endIndex,
    generalMeaning: `${classification}: ${node.type}`,
    contextualMeaning: '', // Will be filled by LLM
    nodeType: isElementary ? 'elementary' : 'composite',
    tokenType: isElementary ? classification : null,
    children: childrenTemp,
  };
}

export function parseCode(code: string): { root: SemanticNode; rawAST: string } {
  const parser = initParser();
  const tree = parser.parse(code);
  const rawAST = tree.rootNode.toString();

  const idCounter = { value: 0 };
  const root = astNodeToSemanticNode(tree.rootNode, code, idCounter);

  if (!root) {
    // Fallback: return code as single node if parsing fails
    return {
      root: {
        id: 'root',
        code,
        startPos: 0,
        endPos: code.length,
        generalMeaning: 'C++ code',
        contextualMeaning: '',
        nodeType: 'composite',
        children: [],
      },
      rawAST,
    };
  }

  return {
    root: {
      ...root,
      id: 'root',
    },
    rawAST,
  };
}

// Flatten tree to list for LLM processing
export function flattenTree(node: SemanticNode): SemanticNode[] {
  const flat: SemanticNode[] = [node];
  for (const child of node.children) {
    flat.push(...flattenTree(child));
  }
  return flat;
}
