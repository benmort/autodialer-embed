import React from 'react';
import { FormConfig, AutodialerColors } from '../types';

interface ConnectedStatusProps {
  formConfig?: FormConfig;
  colors?: AutodialerColors;
  disabled?: boolean;
  onConnect: () => void;
}

export const ConnectedStatus: React.FC<ConnectedStatusProps> = ({ 
  formConfig, 
  colors, 
  disabled = false, 
  onConnect 
}) => {
  return (
    <div className="text-center p-6">
      <div className="mb-4">
        <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Connected</h3>
        <p className="text-gray-600">Connection established successfully</p>
      </div>
      <button
        onClick={onConnect}
        disabled={disabled}
        className="w-full text-white py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          backgroundColor: colors?.primary || '#6b7280'
        }}
      >
        {formConfig?.connectButtonText || 'Start Call'}
      </button>
    </div>
  );
};
