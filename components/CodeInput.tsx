'use client';

import { useState } from 'react';

interface CodeInputProps {
  onAnalyze: (code: string, language: string) => void;
  isLoading: boolean;
}

const exampleCode = `int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}`;

export default function CodeInput({ onAnalyze, isLoading }: CodeInputProps) {
  const [code, setCode] = useState(exampleCode);
  const [language] = useState('C++');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      onAnalyze(code, language);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Programming Language
          </label>
          <div className="px-4 py-2 bg-gray-100 rounded border border-gray-300 text-gray-700">
            C++
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Currently supports C++ only
          </p>
        </div>

        <div>
          <label
            htmlFor="code-input"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Code Snippet
          </label>
          <textarea
            id="code-input"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full h-64 px-4 py-3 font-mono text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your C++ code here..."
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !code.trim()}
          className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Analyzing...
            </span>
          ) : (
            'Analyze Code'
          )}
        </button>
      </form>
    </div>
  );
}
