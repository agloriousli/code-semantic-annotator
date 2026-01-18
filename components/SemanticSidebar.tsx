'use client';

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
  const renderNode = (node: SemanticNode, depth: number = 0) => {
    const isSelected = node.id === selectedNodeId;
    const hasChildren = node.children.length > 0;

    return (
      <div key={node.id} className="mb-2">
        <button
          onClick={() => onSelectNode(node.id)}
          className={`w-full text-left p-3 rounded-lg border transition-colors ${
            isSelected
              ? 'bg-blue-100 border-blue-500 shadow'
              : 'bg-white border-gray-200 hover:bg-gray-50'
          }`}
          style={{ marginLeft: `${depth * 16}px` }}
        >
          <div className="flex items-start gap-2">
            <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded flex-shrink-0">
              {node.nodeType === 'elementary' ? node.tokenType : 'composite'}
            </span>
            <div className="flex-1 min-w-0">
              <code className="text-xs text-gray-800 block truncate">
                {node.code}
              </code>
            </div>
          </div>
          
          <div className="mt-2 space-y-1 text-xs">
            <div>
              <span className="font-semibold text-gray-700">General:</span>
              <p className="text-gray-600 line-clamp-2">{node.generalMeaning}</p>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Contextual:</span>
              <p className="text-gray-600 line-clamp-2">{node.contextualMeaning}</p>
            </div>
          </div>
          
          {hasChildren && (
            <div className="mt-2 text-xs text-gray-500">
              {node.children.length} sub-unit{node.children.length !== 1 ? 's' : ''}
            </div>
          )}
        </button>

        {hasChildren && (
          <div className="ml-4 mt-1 pl-2 border-l-2 border-gray-200">
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4 sticky top-0 bg-white pb-2 border-b">
        Semantic Units
      </h2>
      <div className="text-xs text-gray-600 mb-4 bg-blue-50 p-2 rounded">
        Top-down view of all semantic units. Click to highlight in code.
      </div>
      <div className="space-y-2">
        {renderNode(semanticTree.root)}
      </div>
    </div>
  );
}
