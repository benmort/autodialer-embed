import React from 'react';

interface ErrorStatusProps {
  error?: string;
  disabled?: boolean;
  onRetry: () => void;
}

export const ErrorStatus: React.FC<ErrorStatusProps> = ({ 
  error, 
  disabled = false, 
  onRetry 
}) => {
  return (
    <div className="text-center p-6">
      <div className="mb-4">
        <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Connection Error</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={onRetry}
          disabled={disabled}
          className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Try Again
        </button>
      </div>
    </div>
  );
};
