'use client';

import { useState } from 'react';
import type { SemanticTree } from '@/types/semantic';
import CodeInput from '@/components/CodeInput';
import CodeDisplay from '@/components/CodeDisplay';
import SemanticSidebar from '@/components/SemanticSidebar';

export default function Home() {
  const [semanticTree, setSemanticTree] = useState<SemanticTree | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const handleAnalyze = async (code: string, language: string) => {
    setIsLoading(true);
    setError(null);
    setSemanticTree(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, language }),
      });

      const data = await response.json();

      if (data.success) {
        setSemanticTree(data.data);
      } else {
        setError(data.error || 'Failed to analyze code');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Semantic Code Explorer
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Interactive bottom-up semantic decomposition of code
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {!semanticTree ? (
          <CodeInput onAnalyze={handleAnalyze} isLoading={isLoading} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-lg font-semibold mb-4">Code Analysis</h2>
                <CodeDisplay
                  semanticTree={semanticTree}
                  selectedNodeId={selectedNodeId}
                  onSelectNode={setSelectedNodeId}
                />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">
                  Plain English Translation
                </h3>
                <p className="text-blue-800">
                  {semanticTree.plainEnglishTranslation}
                </p>
              </div>
              <button
                onClick={() => setSemanticTree(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Analyze New Code
              </button>
            </div>
            <div className="lg:col-span-1">
              <SemanticSidebar
                semanticTree={semanticTree}
                selectedNodeId={selectedNodeId}
                onSelectNode={setSelectedNodeId}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">
              <strong>Error:</strong> {error}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
