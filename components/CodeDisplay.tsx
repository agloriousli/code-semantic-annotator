'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import type { SemanticTree, SemanticNode } from '@/types/semantic';

interface CodeDisplayProps {
  semanticTree: SemanticTree;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
}

export default function CodeDisplay({
  semanticTree,
  selectedNodeId,
  onSelectNode,
}: CodeDisplayProps) {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [dragStartLeafId, setDragStartLeafId] = useState<string | null>(null);
  const codeDisplayRef = useRef<HTMLDivElement | null>(null);

  // Build lookup maps once per render
  const { allNodes, leaves, nodesById, parentById } = useMemo(() => {
    const flat: SemanticNode[] = [];
    const parents = new Map<string, SemanticNode | null>();
    const byId = new Map<string, SemanticNode>();

    const dfs = (node: SemanticNode, parent: SemanticNode | null) => {
      flat.push(node);
      byId.set(node.id, node);
      parents.set(node.id, parent);
      node.children.forEach((child) => dfs(child, node));
    };

    dfs(semanticTree.root, null);

    const leafNodes = flat.filter((n) => n.nodeType === 'elementary');

    return {
      allNodes: flat,
      leaves: leafNodes,
      nodesById: byId,
      parentById: parents,
    };
  }, [semanticTree]);

  const findNode = (id: string | null) => (id ? nodesById.get(id) || null : null);

  const findCoveringAncestor = (a: SemanticNode, b: SemanticNode): SemanticNode => {
    const lca = findLowestCommonAncestor(a, b);
    return lca ?? a;
  };

  const findLowestCommonAncestor = (a: SemanticNode, b: SemanticNode): SemanticNode | null => {
    const ancestors = new Set<string>();
    let cur: SemanticNode | null = a;
    while (cur) {
      ancestors.add(cur.id);
      cur = parentById.get(cur.id) || null;
    }
    cur = b;
    while (cur) {
      if (ancestors.has(cur.id)) return cur;
      cur = parentById.get(cur.id) || null;
    }
    return null;
  };

  const handleLeafMouseDown = (leaf: SemanticNode, event: React.MouseEvent) => {
    event.stopPropagation();
    setDragStartLeafId(leaf.id);
  };

  const handleLeafMouseUp = (leaf: SemanticNode, event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();

    const startLeaf = dragStartLeafId ? findNode(dragStartLeafId) : null;

    // If no drag start, treat as simple click
    if (!startLeaf) {
      onSelectNode(leaf.id);
      setDragStartLeafId(null);
      return;
    }

    // Same leaf: toggle
    if (startLeaf.id === leaf.id) {
      if (selectedNodeId === leaf.id) {
        onSelectNode(null);
      } else {
        onSelectNode(leaf.id);
      }
      setDragStartLeafId(null);
      return;
    }

    // Dragged across leaves: select smallest ancestor covering the range
    const covering = findCoveringAncestor(startLeaf, leaf);
    onSelectNode(covering.id);
    setDragStartLeafId(null);
  };

  const handleLeafClick = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  const closePopover = () => {
    onSelectNode(null); // Clear selection
  };

  useEffect(() => {
    const handleClickOutside = () => {
      closePopover();
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const keywordSet = useMemo(
    () =>
      new Set([
        'auto','break','case','char','const','continue','default','do','double','else','enum','extern','float','for','goto','if','inline','int','long','namespace','operator','private','protected','public','register','return','short','signed','sizeof','static','struct','switch','template','this','throw','try','typedef','typename','union','unsigned','using','virtual','void','volatile','while','class','bool','new','delete','friend','constexpr','nullptr','static_cast','dynamic_cast','const_cast','reinterpret_cast','true','false'
      ]),
    []
  );

  const delimiterSet = useMemo(() => new Set(['(', ')', '{', '}', '[', ']', ';', ',']), []);

  const operatorPattern = useMemo(
    () => /^(\+\+|--|==|!=|<=|>=|->|::|\+=|-=|\*=|\/=|%=|&&|\|\||<<|>>|\+|-|\*|\/|%|<|>|=|!|&|\||\^|~)$/,
    []
  );

  const literalPattern = useMemo(
    () => /^(0x[0-9a-fA-F]+|\d+(\.\d+)?([eE][+-]?\d+)?|true|false|"[^"]*"|'[^']*')$/,
    []
  );

  const getTokenCategory = (node: SemanticNode, text: string): 'keyword' | 'identifier' | 'literal' | 'operator' | 'delimiter' | 'composite' => {
    if (node.nodeType === 'composite') return 'composite';

    const declared = node.tokenType?.toLowerCase();
    if (declared === 'keyword' || declared === 'identifier' || declared === 'literal' || declared === 'operator' || declared === 'delimiter') {
      return declared as typeof declared;
    }

    const trimmed = text.trim();
    if (delimiterSet.has(trimmed)) return 'delimiter';
    if (operatorPattern.test(trimmed)) return 'operator';
    if (keywordSet.has(trimmed)) return 'keyword';
    if (literalPattern.test(trimmed)) return 'literal';
    return 'identifier';
  };

  const getColorByCategory = (category: ReturnType<typeof getTokenCategory>): string => {
    switch (category) {
      case 'keyword': return 'bg-purple-200 hover:bg-purple-300';
      case 'identifier': return 'bg-blue-200 hover:bg-blue-300';
      case 'literal': return 'bg-green-200 hover:bg-green-300';
      case 'operator': return 'bg-yellow-200 hover:bg-yellow-300';
      case 'delimiter': return 'bg-gray-200 hover:bg-gray-300';
      default: return 'bg-indigo-100 hover:bg-indigo-200';
    }
  };

  // Render code as non-overlapping atomic semantic units (ASUs)
  const renderHighlightedCode = () => {
    const code = semanticTree.root.code;
    const segments: Array<{ start: number; end: number; leaf: SemanticNode | null }> = [];

    // Use only leaves (atomic units) to build a non-overlapping partition
    const positions = new Set<number>();
    leaves.forEach((leaf) => {
      positions.add(leaf.startPos);
      positions.add(leaf.endPos);
    });
    positions.add(0);
    positions.add(code.length);

    const sorted = Array.from(positions).sort((a, b) => a - b);

    for (let i = 0; i < sorted.length - 1; i++) {
      const start = sorted[i];
      const end = sorted[i + 1];
      const leaf = leaves.find((l) => l.startPos <= start && l.endPos >= end) || null;
      segments.push({ start, end, leaf });
    }

    return segments.map((segment, idx) => {
      const text = code.substring(segment.start, segment.end);
      if (!segment.leaf) return <span key={idx}>{text}</span>;

      const leaf = segment.leaf;
      const selectedNode = findNode(selectedNodeId);
      const isSelected = !!(
        selectedNode &&
        leaf.startPos >= selectedNode.startPos &&
        leaf.endPos <= selectedNode.endPos
      );
      const isHovered = leaf.id === hoveredNodeId;

      const category = getTokenCategory(leaf, text);
      return (
        <span
          data-leaf-id={leaf.id}
          key={idx}
          className={`relative inline cursor-pointer rounded px-0.5 transition-all ${getColorByCategory(category)} ${
            isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : ''
          } ${isHovered ? 'ring-1 ring-gray-400' : ''}`}
          onMouseDown={(e) => handleLeafMouseDown(leaf, e)}
          onMouseUp={(e) => handleLeafMouseUp(leaf, e)}
          onClick={handleLeafClick}
          onMouseEnter={() => setHoveredNodeId(leaf.id)}
          onMouseLeave={() => setHoveredNodeId(null)}
          title={`${leaf.tokenType}: ${leaf.generalMeaning}`}
        >
          {text}
        </span>
      );
    });
  };

  return (
    <div className="space-y-4">
      <div
        ref={codeDisplayRef}
        className="relative font-mono text-sm bg-gray-50 p-4 rounded border border-gray-300 min-h-[200px] overflow-x-auto"
      >
        <pre className="whitespace-pre-wrap break-words">
          {renderHighlightedCode()}
        </pre>
      </div>

      {selectedNodeId && findNode(selectedNodeId) && (
        <div className="bg-white rounded-lg shadow-lg border border-blue-300 p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                {findNode(selectedNodeId)!.nodeType === 'elementary' 
                  ? findNode(selectedNodeId)!.tokenType 
                  : 'composite'}
              </span>
              <code className="text-sm font-semibold text-gray-800 break-all">
                {findNode(selectedNodeId)!.code.substring(0, 100)}
                {findNode(selectedNodeId)!.code.length > 100 ? '...' : ''}
              </code>
            </div>
            <button
              onClick={closePopover}
              className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 ml-2"
              aria-label="Close"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-semibold text-blue-900 mb-1">
                General Meaning
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                {findNode(selectedNodeId)!.generalMeaning}
              </p>
            </div>

            <div className="border-t pt-3">
              <h4 className="text-sm font-semibold text-green-900 mb-1">
                Contextual Meaning
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                {findNode(selectedNodeId)!.contextualMeaning}
              </p>
            </div>

            {findNode(selectedNodeId)!.children.length > 0 && (
              <div className="border-t pt-3">
                <p className="text-xs text-gray-500">
                  Composed of {findNode(selectedNodeId)!.children.length} sub-unit
                  {findNode(selectedNodeId)!.children.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 flex gap-2 flex-wrap text-xs">
        <span className="inline-flex items-center gap-1">
          <span className="w-4 h-4 bg-purple-200 border border-purple-300 rounded"></span>
          Keyword
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-4 h-4 bg-blue-200 border border-blue-300 rounded"></span>
          Identifier
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-4 h-4 bg-green-200 border border-green-300 rounded"></span>
          Literal
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-4 h-4 bg-yellow-200 border border-yellow-300 rounded"></span>
          Operator
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-4 h-4 bg-gray-200 border border-gray-300 rounded"></span>
          Delimiter
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-4 h-4 bg-indigo-100 border border-indigo-200 rounded"></span>
          Composite
        </span>
      </div>
    </div>
  );
}
