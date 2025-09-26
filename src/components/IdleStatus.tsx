import React from 'react';
import { FormConfig } from '../types';

interface IdleStatusProps {
  formConfig?: FormConfig;
}

export const IdleStatus: React.FC<IdleStatusProps> = ({ formConfig }) => {
  // Check if we should show the form message
  const shouldShowFormMessage = formConfig?.showFullForm !== false && (
    formConfig?.showPhone !== false || 
    formConfig?.showName !== false || 
    formConfig?.showEmail !== false
  );

  return (
    <div className="text-center pt-6 px-6">
      <div className="mb-4">
        <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Call</h3>
        {shouldShowFormMessage && (
          <strong className="text-gray-600">Fill in your information to start making calls</strong>
        )}
        <p className="text-gray-600">Click the button below to start the call</p>
      </div>
    </div>
  );
};
