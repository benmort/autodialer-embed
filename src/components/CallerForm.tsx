import React from 'react';
import { CallerData, FormConfig, AutodialerColors } from '../types';

interface CallerFormProps {
  callerData: CallerData;
  formConfig?: FormConfig;
  colors?: AutodialerColors;
  disabled?: boolean;
  validationErrors?: string[];
  onCallerDataChange: (data: CallerData) => void;
  onConnect: () => void;
}

export const CallerForm: React.FC<CallerFormProps> = ({
  callerData,
  formConfig,
  colors,
  disabled = false,
  validationErrors = [],
  onCallerDataChange,
  onConnect
}) => {
  // Helper functions to check field-specific errors
  const hasFieldError = (fieldName: string) => {
    return validationErrors.some(error => 
      error.toLowerCase().includes(fieldName.toLowerCase())
    );
  };

  const getFieldError = (fieldName: string) => {
    return validationErrors.find(error => 
      error.toLowerCase().includes(fieldName.toLowerCase())
    );
  };
  return (
    <div className="p-6 border-b border-gray-200">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">{formConfig?.title || 'Caller Information'}</h2>
      {formConfig?.description && (
        <p className="text-sm text-gray-600 mb-4">{formConfig.description}</p>
      )}
      
      <div className="space-y-4">
        {formConfig?.showPhone !== false && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              value={callerData.phone}
              onChange={(e) => onCallerDataChange({ ...callerData, phone: e.target.value })}
              disabled={disabled}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed ${
                hasFieldError('phone') 
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                  : 'border-gray-300 focus:ring-primary-500'
              }`}
              placeholder="+1234567890"
            />
            {hasFieldError('phone') && (
              <p className="mt-1 text-sm text-red-600">Please enter a valid {getFieldError('phone')}</p>
            )}
          </div>
        )}
        {formConfig?.showName !== false && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={callerData.name}
              onChange={(e) => onCallerDataChange({ ...callerData, name: e.target.value })}
              disabled={disabled}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed ${
                hasFieldError('name') 
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                  : 'border-gray-300 focus:ring-primary-500'
              }`}
              placeholder="Your name"
            />
            {hasFieldError('name') && (
              <p className="mt-1 text-sm text-red-600">Please enter a valid {getFieldError('name')}</p>
            )}
          </div>
        )}
        {formConfig?.showEmail !== false && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={callerData.email}
              onChange={(e) => onCallerDataChange({ ...callerData, email: e.target.value })}
              disabled={disabled}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed ${
                hasFieldError('email') 
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                  : 'border-gray-300 focus:ring-primary-500'
              }`}
              placeholder="your@email.com"
            />
            {hasFieldError('email') && (
              <p className="mt-1 text-sm text-red-600">Please enter a valid {getFieldError('email')}</p>
            )}
          </div>
        )}
        <button
          onClick={onConnect}
          disabled={disabled}
          className="w-full text-white py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: colors?.primary || '#6b7280'
          }}
        >
          {formConfig?.connectButtonText || 'Connect'}
        </button>
      </div>
    </div>
  );
};
