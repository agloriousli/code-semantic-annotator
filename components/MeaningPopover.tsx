'use client';

import { useEffect, useRef } from 'react';
import type { SemanticNode } from '@/types/semantic';

interface MeaningPopoverProps {
  node: SemanticNode;
  position: { x: number; y: number };
  onClose: () => void;
}

export default function MeaningPopover({
  node,
  position,
  onClose,
}: MeaningPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Adjust position to prevent overflow
  const adjustedPosition = { ...position };
  if (popoverRef.current) {
    const rect = popoverRef.current.getBoundingClientRect();
    if (adjustedPosition.x + 400 > window.innerWidth) {
      adjustedPosition.x = window.innerWidth - 420;
    }
    if (adjustedPosition.y + rect.height > window.innerHeight) {
      adjustedPosition.y = adjustedPosition.y - rect.height - 20;
    }
  }

  return (
    <div
      ref={popoverRef}
      className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-300 p-4 max-w-md"
      style={{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y + 10}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
            {node.nodeType === 'elementary' ? node.tokenType : 'composite'}
          </span>
          <code className="text-sm font-semibold text-gray-800">
            {node.code}
          </code>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
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
            {node.generalMeaning}
          </p>
        </div>

        <div className="border-t pt-3">
          <h4 className="text-sm font-semibold text-green-900 mb-1">
            Contextual Meaning
          </h4>
          <p className="text-sm text-gray-700 leading-relaxed">
            {node.contextualMeaning}
          </p>
        </div>

        {node.children.length > 0 && (
          <div className="border-t pt-3">
            <p className="text-xs text-gray-500">
              Composed of {node.children.length} sub-unit{node.children.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
