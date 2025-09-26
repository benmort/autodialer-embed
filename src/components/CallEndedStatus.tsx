import React from 'react';
import { FormConfig, AutodialerColors } from '../types';

interface CallEndedStatusProps {
  formConfig?: FormConfig;
  colors?: AutodialerColors;
  disabled?: boolean;
  onReset: () => void;
}

export const CallEndedStatus: React.FC<CallEndedStatusProps> = ({ 
  formConfig, 
  colors, 
  disabled = false, 
  onReset 
}) => {
  return (
    <div className="text-center p-6">
      <div className="mb-4">
        <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Call Ended</h3>
        <p className="text-gray-600 mb-4">{formConfig?.callEndMessage || 'Thank you for your call. Have a great day!'}</p>
      </div>
      <button
        onClick={onReset}
        disabled={disabled}
        className="w-full text-white py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          backgroundColor: colors?.primary || '#6b7280'
        }}
      >
        Make Another Call
      </button>
    </div>
  );
};
