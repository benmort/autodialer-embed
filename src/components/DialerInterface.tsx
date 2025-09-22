import React, { useState, useEffect } from 'react';
import { AutodialerService } from '../services/AutodialerService';
import { AutodialerState, CallerData, AutodialerColors } from '../types';

interface FormConfig {
  title?: string;
  description?: string;
  showPhone?: boolean;
  showName?: boolean;
  showEmail?: boolean;
  connectButtonText?: string;
  cancelButtonText?: string;
  showFullForm?: boolean;
}

interface DialerInterfaceProps {
  service: AutodialerService;
  initialData?: Partial<CallerData>;
  colors?: AutodialerColors;
  disabled?: boolean;
  formConfig?: FormConfig;
}

// Helper function to generate CSS custom properties
const generateColorStyles = (colors?: AutodialerColors): React.CSSProperties => {
  if (!colors) return {};
  
  const styles: React.CSSProperties = {
    '--autodialer-primary': colors.primary,
    '--autodialer-secondary': colors.secondary,
  } as React.CSSProperties;
  
  if (colors.background) {
    styles['--autodialer-background'] = colors.background;
  }
  
  if (colors.text) {
    styles['--autodialer-text'] = colors.text;
  }
  
  return styles;
};

export const DialerInterface: React.FC<DialerInterfaceProps> = ({ 
  service, 
  initialData = {},
  colors,
  disabled = false,
  formConfig
}) => {
  const [state, setState] = useState<AutodialerState>(service.getState());
  const [callerData, setCallerData] = useState<CallerData>({
    phone: initialData.phone || '',
    name: initialData.name || '',
    email: initialData.email || '',
    caller_channel_id: initialData.caller_channel_id || '',
    referralCode: initialData.referralCode
  });

  const colorStyles = generateColorStyles(colors);

  useEffect(() => {
    const handleStatusChange = (status: AutodialerState['status']) => {
      setState(service.getState());
    };

    const handleError = (error: string) => {
      setState(service.getState());
    };

    service.setEvents({
      onStatusChange: handleStatusChange,
      onError: handleError
    });

    return () => {
      service.setEvents({});
    };
  }, [service]);

  const handleConnect = async () => {
    // If showFullForm is false, skip validation since no fields are shown
    if (formConfig?.showFullForm === false) {
      try {
        await service.startCall(callerData);
      } catch (error) {
        console.error('Failed to start call:', error);
      }
      return;
    }

    // Check which fields are required based on form configuration
    const requiredFields = [];
    if (formConfig?.showPhone !== false) requiredFields.push('phone');
    if (formConfig?.showName !== false) requiredFields.push('name');
    if (formConfig?.showEmail !== false) requiredFields.push('email');
    
    // Check if all required fields are filled
    const missingFields = requiredFields.filter(field => !callerData[field as keyof CallerData]);
    
    if (missingFields.length > 0) {
      const fieldNames = missingFields.map(field => {
        switch (field) {
          case 'phone': return 'Phone Number';
          case 'name': return 'Name';
          case 'email': return 'Email';
          default: return field;
        }
      });
      alert(`Please fill in the following required fields: ${fieldNames.join(', ')}`);
      return;
    }

    try {
      await service.startCall(callerData);
    } catch (error) {
      console.error('Failed to start call:', error);
    }
  };

  const handleDisconnect = () => {
    service.endCall();
  };

  const renderStatus = () => {
    switch (state.status) {
      case 'idle':
        return (
          <div className="text-center p-6">
            <div className="mb-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Call</h3>
              <p className="text-gray-600">Fill in your information to start making calls</p>
            </div>
          </div>
        );
      
      case 'connecting':
        return (
          <div className="text-center p-6">
            <div className="mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Connecting...</h3>
              <p className="text-gray-600">Setting up your connection</p>
            </div>
          </div>
        );
      
      case 'connected':
        return (
          <div className="text-center p-6">
            <div className="mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Connected</h3>
              <p className="text-gray-600">You're ready to make calls</p>
            </div>
            <button
              onClick={handleConnect}
              disabled={disabled}
              className="w-full text-white py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: colors?.primary || '#6b7280',
                ':hover': {
                  backgroundColor: colors?.secondary || '#9ca3af'
                }
              }}
            >
              {formConfig?.connectButtonText || 'Start Calling'}
            </button>
          </div>
        );
      
      case 'in-call':
        return (
          <div className="text-center p-6">
            <div className="mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Call in Progress</h3>
              <p className="text-gray-600">You are currently on a call</p>
            </div>
            <button
              onClick={handleDisconnect}
              disabled={disabled}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {formConfig?.cancelButtonText || 'End Call'}
            </button>
          </div>
        );
      
      case 'error':
        return (
          <div className="text-center p-6">
            <div className="mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Connection Error</h3>
              <p className="text-gray-600 mb-4">{state.error}</p>
              <button
                onClick={() => setState({ status: 'idle' })}
                disabled={disabled}
                className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Try Again
              </button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-lg max-w-md mx-auto"
      style={colorStyles}
    >
      {state.status === 'idle' && formConfig?.showFullForm !== false && (
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
                  onChange={(e) => setCallerData({ ...callerData, phone: e.target.value })}
                  disabled={disabled}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                  placeholder="+1234567890"
                />
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
                  onChange={(e) => setCallerData({ ...callerData, name: e.target.value })}
                  disabled={disabled}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                  placeholder="Your name"
                />
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
                  onChange={(e) => setCallerData({ ...callerData, email: e.target.value })}
                  disabled={disabled}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                  placeholder="your@email.com"
                />
              </div>
            )}
            <button
              onClick={handleConnect}
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
      )}
      
      {state.status === 'idle' && formConfig?.showFullForm === false && (
        <div className="p-6">
          <div className="space-y-2">
            <button
              onClick={handleConnect}
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
      )}
      
      {renderStatus()}
    </div>
  );
};
