'use client';

import { useState, useRef, useEffect } from 'react';
import type { SemanticTree, SemanticNode } from '@/types/semantic';
import MeaningPopover from './MeaningPopover';

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
  const [popoverNode, setPopoverNode] = useState<SemanticNode | null>(null);
  const [popoverPosition, setPopoverPosition] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Collect all nodes in a flat array for rendering
  const allNodes: SemanticNode[] = [];
  
  const collectNodes = (node: SemanticNode) => {
    allNodes.push(node);
    node.children.forEach(collectNodes);
  };
  
  collectNodes(semanticTree.root);

  // Sort by size (largest first) so smaller nodes render on top
  allNodes.sort((a, b) => {
    const sizeA = a.endPos - a.startPos;
    const sizeB = b.endPos - b.startPos;
    return sizeB - sizeA;
  });

  const handleNodeClick = (node: SemanticNode, event: React.MouseEvent) => {
    event.stopPropagation();
    onSelectNode(node.id);
    setPopoverNode(node);
    setPopoverPosition({ x: event.clientX, y: event.clientY });
  };

  const handleNodeHover = (nodeId: string | null) => {
    setHoveredNodeId(nodeId);
  };

  const closePopover = () => {
    setPopoverNode(null);
    setPopoverPosition(null);
  };

  useEffect(() => {
    const handleClickOutside = () => {
      closePopover();
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const getNodeColor = (node: SemanticNode): string => {
    if (node.nodeType === 'elementary') {
      switch (node.tokenType) {
        case 'keyword': return 'bg-purple-100 border-purple-300';
        case 'identifier': return 'bg-blue-100 border-blue-300';
        case 'literal': return 'bg-green-100 border-green-300';
        case 'operator': return 'bg-yellow-100 border-yellow-300';
        case 'delimiter': return 'bg-gray-100 border-gray-300';
        default: return 'bg-gray-100 border-gray-300';
      }
    }
    return 'bg-indigo-50 border-indigo-200';
  };

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="relative font-mono text-sm bg-gray-50 p-4 rounded border border-gray-300 min-h-[200px]"
        style={{ position: 'relative' }}
      >
        {/* Base code text */}
        <pre className="whitespace-pre-wrap break-words relative z-0 pointer-events-none">
          {semanticTree.root.code}
        </pre>

        {/* Semantic blocks overlay */}
        <div className="absolute inset-0 p-4" style={{ pointerEvents: 'none' }}>
          {allNodes.map((node) => {
            const isSelected = node.id === selectedNodeId;
            const isHovered = node.id === hoveredNodeId;
            const code = semanticTree.root.code;
            
            // Calculate position
            const beforeText = code.substring(0, node.startPos);
            const nodeText = code.substring(node.startPos, node.endPos);
            
            // Simple positioning (works for single line, needs improvement for multiline)
            const lines = beforeText.split('\n');
            const lastLine = lines[lines.length - 1];
            const left = lastLine.length;
            const top = lines.length - 1;
            
            return (
              <span
                key={node.id}
                className={`absolute inline-block border-2 rounded transition-all cursor-pointer ${getNodeColor(node)} ${
                  isSelected ? 'ring-2 ring-blue-500 z-20' : ''
                } ${isHovered ? 'opacity-90 z-10' : 'opacity-40'}`}
                style={{
                  left: `${left}ch`,
                  top: `${top * 1.5}em`,
                  width: `${nodeText.length}ch`,
                  height: '1.5em',
                  pointerEvents: 'auto',
                }}
                onClick={(e) => handleNodeClick(node, e)}
                onMouseEnter={() => handleNodeHover(node.id)}
                onMouseLeave={() => handleNodeHover(null)}
                title={node.generalMeaning}
              />
            );
          })}
        </div>
      </div>

      {popoverNode && popoverPosition && (
        <MeaningPopover
          node={popoverNode}
          position={popoverPosition}
          onClose={closePopover}
        />
      )}

      <div className="mt-4 flex gap-2 flex-wrap text-xs">
        <span className="inline-flex items-center gap-1">
          <span className="w-4 h-4 bg-purple-100 border border-purple-300 rounded"></span>
          Keyword
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></span>
          Identifier
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-4 h-4 bg-green-100 border border-green-300 rounded"></span>
          Literal
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></span>
          Operator
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></span>
          Delimiter
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-4 h-4 bg-indigo-50 border border-indigo-200 rounded"></span>
          Composite
        </span>
      </div>
    </div>
  );
}
