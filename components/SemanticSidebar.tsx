'use client';

import { useEffect, useRef } from 'react';
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

  useEffect(() => {
    if (selectedNodeId && nodeRefsMap.current.has(selectedNodeId)) {
      const element = nodeRefsMap.current.get(selectedNodeId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [selectedNodeId]);

  const renderNode = (node: SemanticNode, depth: number = 0) => {
    const isSelected = node.id === selectedNodeId;
    const hasChildren = node.children.length > 0;

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
          className={`block w-full max-w-full text-left p-3 rounded-lg border transition-colors ${
            isSelected
              ? 'bg-blue-100 border-blue-500 shadow'
              : 'bg-white border-gray-200 hover:bg-gray-50'
          }`}
          style={{ paddingLeft: `${12 + depth * 12}px` }}
        >
          <div className="flex items-start gap-2 min-w-0 max-w-full">
            <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded flex-shrink-0 whitespace-nowrap">
              {node.nodeType === 'elementary' ? node.tokenType : 'composite'}
            </span>
            <div className="flex-1 min-w-0 overflow-hidden">
              <code className="text-xs text-gray-800 block break-words whitespace-pre-wrap">
                {node.code}
              </code>
            </div>
          </div>
          
          <div className="mt-2 space-y-1 text-xs min-w-0 max-w-full">
            <div className="min-w-0 max-w-full">
              <span className="font-semibold text-gray-700">General:</span>
              <p className="text-gray-600 break-words whitespace-pre-wrap">{node.generalMeaning}</p>
            </div>
            <div className="min-w-0 max-w-full">
              <span className="font-semibold text-gray-700">Contextual:</span>
              <p className="text-gray-600 break-words whitespace-pre-wrap">{node.contextualMeaning}</p>
            </div>
          </div>
          
          {hasChildren && (
            <div className="mt-2 text-xs text-gray-500">
              {node.children.length} sub-unit{node.children.length !== 1 ? 's' : ''}
            </div>
          )}
        </button>

        {hasChildren && (
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
