import React from 'react';

interface ElectoralPostcodeProps {
  postcodeData: any;
  dialpadInput: string;
  disabled?: boolean;
  isSubmitting?: boolean;
  lastSubmissionStatus?: 'success' | 'error' | null;
  onDialpadInput: (digit: string) => void;
  onSubmitResponse: () => void;
}

export const ElectoralPostcode: React.FC<ElectoralPostcodeProps> = ({
  postcodeData,
  dialpadInput,
  disabled = false,
  isSubmitting = false,
  lastSubmissionStatus,
  onDialpadInput,
  onSubmitResponse
}) => {
  // Extract message and step from the postcode data
  const message = postcodeData?.message || 'Please enter your postcode';
  const step = postcodeData?.step || 'postcode_input';
  
  return (
    <div className="mt-4">
      {/* Electoral Postcode Instructions */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Electoral Postcode:
        </label>
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <p className="text-gray-800 font-medium">{message}</p>
        </div>
      </div>

      {/* Dialpad for postcode input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Enter your 4-digit postcode:
        </label>
        <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((digit) => (
            <button
              key={digit}
              onClick={() => onDialpadInput(digit)}
              disabled={disabled || isSubmitting}
              className="w-full h-12 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-mono transition-colors"
            >
              {digit}
            </button>
          ))}
        </div>
      </div>

      {/* Current input display */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Current input:
        </label>
        <div className="bg-gray-50 border border-gray-300 rounded-md p-3 text-center">
          <span className="text-2xl font-mono text-gray-800">
            {dialpadInput || '____'}
          </span>
        </div>
      </div>

      {/* Submit button */}
      <div className="mb-4">
        <button
          onClick={onSubmitResponse}
          disabled={!dialpadInput.trim() || dialpadInput.length !== 4 || disabled || isSubmitting}
          className="w-full py-3 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
            'Submit Postcode'
          )}
        </button>
      </div>

      {/* Status Messages */}
      {lastSubmissionStatus && (
        <div className={`mb-3 p-2 rounded-md text-sm text-center ${
          lastSubmissionStatus === 'success' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {lastSubmissionStatus === 'success' ? '✓ Postcode sent successfully' : '✗ Failed to send postcode'}
        </div>
      )}
    </div>
  );
};
