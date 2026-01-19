'use client';

import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { SemanticTree, SemanticNode } from '@/types/semantic';

interface SemanticSidebarProps {
  semanticTree: SemanticTree;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
}

export default function SemanticSidebar({
  semanticTree,
  selectedNodeId,
  onSelectNode,
}: SemanticSidebarProps) {
  const nodeRefsMap = useRef<Map<string, HTMLDivElement>>(new Map());
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const { parentById, nodesById } = useMemo(() => {
    const parents = new Map<string, string | null>();
    const nodes = new Map<string, SemanticNode>();

    const dfs = (node: SemanticNode, parent: SemanticNode | null) => {
      nodes.set(node.id, node);
      parents.set(node.id, parent ? parent.id : null);
      node.children.forEach((child) => dfs(child, node));
    };

    dfs(semanticTree.root, null);

    return { parentById: parents, nodesById: nodes };
  }, [semanticTree]);

  useEffect(() => {
    if (!selectedNodeId || !nodesById.has(selectedNodeId)) return;

    const ancestors = new Set<string>();
    let current: string | null = selectedNodeId;
    while (current) {
      ancestors.add(current);
      current = parentById.get(current) ?? null;
    }

    setExpandedNodes((prev) => {
      const next = new Set(prev);
      ancestors.forEach((id) => next.add(id));
      return next;
    });
  }, [selectedNodeId, parentById, nodesById]);

  useEffect(() => {
    if (selectedNodeId && nodeRefsMap.current.has(selectedNodeId)) {
      const element = nodeRefsMap.current.get(selectedNodeId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [selectedNodeId, expandedNodes]);

  const renderNode = (node: SemanticNode, depth: number = 0) => {
    const isSelected = node.id === selectedNodeId;
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);

    const toggleExpand = (e: React.MouseEvent) => {
      e.stopPropagation();
      setExpandedNodes((prev) => {
        const next = new Set(prev);
        if (next.has(node.id)) {
          next.delete(node.id);
        } else {
          next.add(node.id);
        }
        return next;
      });
    };

    const getNodeColor = (): string => {
      if (node.nodeType === 'elementary') {
        const tokenType = node.tokenType?.toLowerCase();
        switch (tokenType) {
          case 'keyword': return 'bg-purple-100 hover:bg-purple-200';
          case 'identifier': return 'bg-blue-100 hover:bg-blue-200';
          case 'literal': return 'bg-green-100 hover:bg-green-200';
          case 'operator': return 'bg-yellow-100 hover:bg-yellow-200';
          case 'delimiter': return 'bg-gray-100 hover:bg-gray-200';
          default: return 'bg-gray-50 hover:bg-gray-100';
        }
      }
      return 'bg-indigo-50 hover:bg-indigo-100';
    };

    return (
      <div
        key={node.id}
        ref={(el) => {
          if (el) {
            nodeRefsMap.current.set(node.id, el);
          }
        }}
        className="mb-2"
      >
        <button
          onClick={() => onSelectNode(node.id)}
          className={`block w-full max-w-full text-left p-3 rounded-lg border transition-colors select-text ${
            isSelected
              ? `${getNodeColor()} border-blue-500 shadow font-semibold`
              : `${getNodeColor()} border-gray-200`
          }`}
          style={{ paddingLeft: `${12 + depth * 12}px` }}
        >
          <div className="flex items-start gap-2 min-w-0 max-w-full">
            {hasChildren && (
              <div
                role="button"
                tabIndex={0}
                onClick={toggleExpand}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleExpand(e as unknown as React.MouseEvent);
                  }
                }}
                className="flex-shrink-0 mt-1 text-gray-500 hover:text-gray-700"
                aria-label={isExpanded ? 'Collapse' : 'Expand'}
              >
                <svg
                  className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            )}

            <div className="flex-1 min-w-0 overflow-hidden">
              <code
                className={`text-xs block break-words whitespace-pre-wrap ${
                  isSelected
                    ? 'text-blue-900 font-semibold bg-blue-50 px-1 rounded'
                    : 'text-gray-800'
                }`}
              >
                {node.code}
              </code>
            </div>
          </div>

          <div className="mt-2 space-y-1 text-xs min-w-0 max-w-full">
            <div className="min-w-0 max-w-full">
              <span className={`font-semibold ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
                General:
              </span>
              <p
                className={`break-words whitespace-pre-wrap ${
                  isSelected ? 'text-blue-800' : 'text-gray-600'
                }`}
              >
                {node.generalMeaning}
              </p>
            </div>
            <div className="min-w-0 max-w-full">
              <span className={`font-semibold ${isSelected ? 'text-green-900' : 'text-gray-700'}`}>
                Contextual:
              </span>
              <p
                className={`break-words whitespace-pre-wrap ${
                  isSelected ? 'text-green-800' : 'text-gray-600'
                }`}
              >
                {node.contextualMeaning}
              </p>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between gap-2">
            {hasChildren && (
              <div className="text-xs text-gray-500">
                {node.children.length} sub-unit{node.children.length !== 1 ? 's' : ''}
              </div>
            )}
            <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded flex-shrink-0 whitespace-nowrap">
              {node.nodeType === 'elementary' ? node.tokenType : 'composite'}
            </span>
          </div>
        </button>

        {hasChildren && isExpanded && (
          <div className="ml-2 mt-1 pl-2 border-l-2 border-gray-200 max-w-full overflow-visible">
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow sticky top-4 max-h-[calc(100vh-2rem)] flex flex-col overflow-hidden">
      <div className="flex-shrink-0 p-4 border-b bg-white">
        <h2 className="text-lg font-semibold">Semantic Units</h2>
        <div className="text-xs text-gray-600 mt-2 bg-blue-50 p-2 rounded break-words">
          Top-down view of all semantic units. Click to highlight in code.
        </div>
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-2 min-w-0">
        {renderNode(semanticTree.root)}
      </div>
    </div>
  );
}
