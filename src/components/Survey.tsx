import React from 'react';

interface SurveyProps {
  surveyData: any;
  dialpadInput: string;
  disabled?: boolean;
  isSubmitting?: boolean;
  lastSubmissionStatus?: 'success' | 'error' | null;
  onDialpadInput: (input: string) => void;
  onSurveyResponse: (response: string) => void;
  onSubmitResponse: () => void;
}

export const Survey: React.FC<SurveyProps> = ({
  surveyData,
  dialpadInput,
  disabled = false,
  isSubmitting = false,
  lastSubmissionStatus,
  onDialpadInput,
  onSurveyResponse,
  onSubmitResponse
}) => {
  // Extract survey question and response options from the survey data
  const question = surveyData?.questionData?.name || surveyData?.question || surveyData?.message || 'Survey Question';
  const answers = surveyData?.questionData?.answers || {};
  
  // Convert answers object to array format for rendering
  const responseOptions = Object.keys(answers).map(key => ({
    key: key,
    value: answers[key]?.value || answers[key],
    label: answers[key]?.value || answers[key]
  }));
  
  return (
    <div className="mt-4">
      {/* Survey Question */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Survey Question:
        </label>
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-gray-800 font-medium">{question}</p>
        </div>
      </div>

      {/* Response Options */}
      {responseOptions.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Choose your response:
          </label>
          <div className="grid grid-cols-1 gap-2">
            {responseOptions.map((option: any, index: number) => (
              <button
                key={index}
                onClick={() => onSurveyResponse(option.key || index.toString())}
                disabled={disabled || isSubmitting}
                className="w-full py-3 px-4 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed text-left transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-gray-800">{option.label || option.text || option.value}</span>
                  {option.key && (
                    <span className="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                      {option.key}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Fallback: Manual input if no response options */}
      {responseOptions.length === 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Manual Response:
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={dialpadInput}
              onChange={(e) => onDialpadInput(e.target.value)}
              disabled={disabled || isSubmitting}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Enter your response..."
            />
            <button
              onClick={onSubmitResponse}
              disabled={!dialpadInput.trim() || disabled || isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </>
              ) : (
                'Submit'
              )}
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
          {lastSubmissionStatus === 'success' ? '✓ Response sent successfully' : '✗ Failed to send response'}
        </div>
      )}
    </div>
  );
};
