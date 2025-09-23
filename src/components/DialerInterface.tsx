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
  callEndMessage?: string;
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
    (styles as any)['--autodialer-background'] = colors.background;
  }
  
  if (colors.text) {
    (styles as any)['--autodialer-text'] = colors.text;
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
  const [dialpadInput, setDialpadInput] = useState<string>('');
  const [responseHistory, setResponseHistory] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [lastSubmissionStatus, setLastSubmissionStatus] = useState<'success' | 'error' | null>(null);

  const colorStyles = generateColorStyles(colors);

  useEffect(() => {
    const handleStatusChange = (_status: AutodialerState['status']) => {
      setState(service.getState());
    };

    const handleError = (_error: string) => {
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

  // Keyboard support for dialpad
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (state.status !== 'in-call') return;
      
      const key = event.key;
      
      // Allow numbers, *, #, and special keys
      if (/[0-9*#]/.test(key)) {
        event.preventDefault();
        handleDialpadInput(key);
      } else if (key === 'Backspace') {
        event.preventDefault();
        handleDialpadBackspace();
      } else if (key === 'Enter') {
        event.preventDefault();
        handleSubmitResponse();
      } else if (key === 'Escape') {
        event.preventDefault();
        handleDialpadClear();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [state.status]); // Removed dialpadInput dependency to avoid stale closures

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

  const handleResetToIdle = () => {
    setState({ status: 'idle' });
    setResponseHistory([]);
    setDialpadInput('');
    setLastSubmissionStatus(null);
  };

  const handleDialpadInput = (digit: string) => {
    setDialpadInput(prev => prev + digit);
  };

  const handleDialpadClear = () => {
    setDialpadInput('');
  };

  const handleDialpadBackspace = () => {
    setDialpadInput(prev => prev.slice(0, -1));
  };

  const handleSubmitResponse = async () => {
    console.log('handleSubmitResponse called:', { dialpadInput, isSubmitting, disabled });
    
    if (dialpadInput.trim() && !isSubmitting) {
      setIsSubmitting(true);
      setLastSubmissionStatus(null);
      
      try {
        console.log('Attempting to send response:', dialpadInput);
        await service.sendResponse(dialpadInput);
        console.log('Response submitted successfully:', dialpadInput);
        
        // Add to response history
        setResponseHistory(prev => [...prev, dialpadInput]);
        setDialpadInput('');
        setLastSubmissionStatus('success');
        
        // Clear success status after 2 seconds
        setTimeout(() => setLastSubmissionStatus(null), 2000);
      } catch (error) {
        console.error('Failed to submit response:', error);
        setLastSubmissionStatus('error');
        
        // Clear error status after 3 seconds
        setTimeout(() => setLastSubmissionStatus(null), 3000);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      console.log('Submit blocked:', { hasInput: !!dialpadInput.trim(), isSubmitting, disabled });
    }
  };

  const renderDialpad = () => {
    const dialpadNumbers = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['*', '0', '#']
    ];

    return (
      <div className="mt-4">
        {/* Response History */}
        {responseHistory.length > 0 && (
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Previous Responses ({responseHistory.length}):
            </label>
            <div className="bg-gray-50 border border-gray-200 rounded-md p-2 max-h-20 overflow-y-auto">
              <div className="flex flex-wrap gap-1">
                {responseHistory.map((response, index) => (
                  <span
                    key={index}
                    className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                  >
                    {response}
                  </span>
                ))}
              </div>
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

        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter Response:
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={dialpadInput}
              readOnly
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-center text-lg font-mono"
              placeholder="Enter numbers..."
            />
            <button
              onClick={handleDialpadBackspace}
              disabled={!dialpadInput || disabled || isSubmitting}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ⌫
            </button>
            <button
              onClick={handleDialpadClear}
              disabled={!dialpadInput || disabled || isSubmitting}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-2 mb-3">
          {dialpadNumbers.map((row, rowIndex) => (
            row.map((digit, colIndex) => (
              <button
                key={`${rowIndex}-${colIndex}`}
                onClick={() => handleDialpadInput(digit)}
                disabled={disabled}
                className="px-4 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 active:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold"
              >
                {digit}
              </button>
            ))
          ))}
        </div>
        
        <button
          onClick={handleSubmitResponse}
          disabled={!dialpadInput.trim() || disabled || isSubmitting}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
            'Submit Response'
          )}
        </button>
      </div>
    );
  };

  const renderStatus = () => {
    switch (state.status) {
      case 'idle':
        // Check if we should show the form message
        const shouldShowFormMessage = formConfig?.showFullForm !== false && (
          formConfig?.showPhone !== false || 
          formConfig?.showName !== false || 
          formConfig?.showEmail !== false
        );
        
        return (
          <div className="text-center p-6">
            <div className="mb-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Call</h3>
              {shouldShowFormMessage && (
                <p className="text-gray-600">Fill in your information to start making calls</p>
              )}
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
              <p className="text-gray-600">Ready to start calling</p>
            </div>
            <button
              onClick={handleConnect}
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
      
      case 'in-call':
        return (
          <div className="p-6">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Call in Progress</h3>
              <p className="text-gray-600">You are currently on a call</p>
            </div>
            
            {renderDialpad()}
            
            <button
              onClick={handleDisconnect}
              disabled={disabled}
              className="w-full mt-4 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {formConfig?.cancelButtonText || 'End Call'}
            </button>
          </div>
        );
      
      case 'call-ended':
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
              onClick={handleResetToIdle}
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
