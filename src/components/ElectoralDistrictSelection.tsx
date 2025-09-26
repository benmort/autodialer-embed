import React from 'react';

interface ElectoralDistrictSelectionProps {
  districtData: any;
  disabled?: boolean;
  isSubmitting?: boolean;
  lastSubmissionStatus?: 'success' | 'error' | null;
  onSurveyResponse: (response: string) => void;
}

export const ElectoralDistrictSelection: React.FC<ElectoralDistrictSelectionProps> = ({
  districtData,
  disabled = false,
  isSubmitting = false,
  lastSubmissionStatus,
  onSurveyResponse
}) => {
  // Extract districts and message from the data
  const districts = districtData?.districts || [];
  const message = districtData?.message || 'Please select your district';
  
  return (
    <div className="mt-4">
      {/* District Selection Instructions */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Your District:
        </label>
        <div className="bg-indigo-50 border border-indigo-200 rounded-md p-3">
          <p className="text-gray-800 font-medium">{message}</p>
        </div>
      </div>

      {/* District Options */}
      {districts.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Choose your district:
          </label>
          <div className="grid grid-cols-1 gap-2">
            {districts.map((district: any, index: number) => (
              <button
                key={index}
                onClick={() => onSurveyResponse((index + 1).toString())}
                disabled={disabled || isSubmitting}
                className="w-full py-3 px-4 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed text-left transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-gray-800 font-medium">{district.name || district}</span>
                  <span className="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                    {index + 1}
                  </span>
                </div>
              </button>
            ))}
            
            {/* Unsure Option */}
            <button
              onClick={() => onSurveyResponse('0')}
              disabled={disabled || isSubmitting}
              className="w-full py-3 px-4 bg-gray-50 border border-gray-300 rounded-md hover:bg-gray-100 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed text-left transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">Unsure</span>
                <span className="text-sm text-gray-500 font-mono bg-gray-200 px-2 py-1 rounded">
                  0
                </span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Status Messages */}
      {lastSubmissionStatus && (
        <div className={`mb-3 p-2 rounded-md text-sm text-center ${
          lastSubmissionStatus === 'success' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {lastSubmissionStatus === 'success' ? '✓ District selected successfully' : '✗ Failed to select district'}
        </div>
      )}
    </div>
  );
};
