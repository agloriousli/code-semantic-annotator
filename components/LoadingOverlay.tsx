'use client';

interface LoadingOverlayProps {
  isVisible: boolean;
  stage: 'parsing' | 'adding-meanings' | 'complete';
  progress: number; // 0-100
}

export default function LoadingOverlay({
  isVisible,
  stage,
  progress,
}: LoadingOverlayProps) {
  if (!isVisible) return null;

  let stageNumber = 1;
  let stageLabel = '';

  if (stage === 'parsing') {
    stageNumber = 1;
    stageLabel = 'Parsing C++ code structure...';
  } else if (stage === 'adding-meanings') {
    stageNumber = 2;
    stageLabel = 'Adding semantic meanings...';
  } else {
    stageLabel = 'Complete!';
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Analyzing Code
        </h2>
        
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">
              {stage === 'complete' ? 'Done' : `Stage ${stageNumber}/2`}
            </span>
            <span className="text-sm text-gray-600">
              {progress}%
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <p className="text-sm text-gray-700 text-center">
          {stageLabel}
        </p>

        <div className="mt-6 flex gap-2">
          <div className="flex-1">
            <div className={`text-xs font-medium p-2 rounded text-center ${
              stageNumber >= 1 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
            }`}>
              1: Parse
            </div>
          </div>
          <div className="flex-1">
            <div className={`text-xs font-medium p-2 rounded text-center ${
              stageNumber >= 2 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
            }`}>
              2: Meanings
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
