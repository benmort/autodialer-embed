import React, { useState, useEffect } from 'react';
import { AutodialerService } from '../services/AutodialerService';
import { AutodialerState, CallerData, AutodialerColors, CallLogEntry, FormConfig } from '../types';
import { CallLog } from './CallLog';
import { IdleStatus } from './IdleStatus';
import { ConnectingStatus } from './ConnectingStatus';
import { ConnectedStatus } from './ConnectedStatus';
import { InCallStatus } from './InCallStatus';
import { CallEndedStatus } from './CallEndedStatus';
import { ErrorStatus } from './ErrorStatus';
import { ElectoralPostcode } from './ElectoralPostcode';
import { ElectoralDistrictSelection } from './ElectoralDistrictSelection';
import { Survey } from './Survey';
import { CallerForm } from './CallerForm';


interface DialerInterfaceProps {
  service: AutodialerService;
  initialData?: Partial<CallerData>;
  colors?: AutodialerColors;
  disabled?: boolean;
  formConfig?: FormConfig;
}


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
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [lastSubmissionStatus, setLastSubmissionStatus] = useState<'success' | 'error' | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Use callLog from the service state instead of maintaining separate local state
  const callLog = state.callLog || [];

  useEffect(() => {
    const handleStatusChange = (_status: AutodialerState['status']) => {
      const newState = service.getState();
      setState(newState);
    };

    const handleError = (_error: string) => {
      const newState = service.getState();
      setState(newState);
    };

    const handleCallLogUpdate = (_updatedCallLog: CallLogEntry[]) => {
      // Update the state to trigger a re-render with the latest service state
      setState(service.getState());
    };

    service.setEvents({
      onStatusChange: handleStatusChange,
      onError: handleError,
      onCallLogUpdate: handleCallLogUpdate
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
    // Clear previous validation errors
    setValidationErrors([]);
    
    // Validate form data
    const validation = validateCallerData();
    
    if (!validation.isValid) {
      const fieldNames = validation.missingFields.map(field => {
        switch (field) {
          case 'phone': return 'Phone Number';
          case 'name': return 'Name';
          case 'email': return 'Email';
          default: return field;
        }
      });
      setValidationErrors(fieldNames);
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
    setState({ status: 'idle', callLog: [] });
    setDialpadInput('');
    setLastSubmissionStatus(null);
    setValidationErrors([]);
    // Call log will be reset by the service state
  };

  const handleCallerDataChange = (data: CallerData) => {
    setCallerData(data);
    // Clear validation errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
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
    if (dialpadInput.trim() && !isSubmitting) {
      setIsSubmitting(true);
      setLastSubmissionStatus(null);
      
      try {
        await service.sendResponse(dialpadInput);
        // Add to response history
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
    }
  };

  const handleSurveyResponse = async (response: string) => {
    if (response && !isSubmitting) {
      setIsSubmitting(true);
      setLastSubmissionStatus(null);
      
      try {
        await service.sendResponse(response);
        // Add to response history
        setLastSubmissionStatus('success');
        // Clear success status after 2 seconds
        setTimeout(() => setLastSubmissionStatus(null), 2000);
      } catch (error) {
        console.error('Failed to submit survey response:', error);
        setLastSubmissionStatus('error');
        // Clear error status after 3 seconds
        setTimeout(() => setLastSubmissionStatus(null), 3000);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const renderElectoralPostcode = (postcodeData: any) => {
    return (
      <ElectoralPostcode
        postcodeData={postcodeData}
        dialpadInput={dialpadInput}
        disabled={disabled}
        isSubmitting={isSubmitting}
        lastSubmissionStatus={lastSubmissionStatus}
        onDialpadInput={handleDialpadInput}
        onSubmitResponse={handleSubmitResponse}
      />
    );
  };

  const renderElectoralDistrictSelection = (districtData: any) => {
    return (
      <ElectoralDistrictSelection
        districtData={districtData}
        disabled={disabled}
        isSubmitting={isSubmitting}
        lastSubmissionStatus={lastSubmissionStatus}
        onSurveyResponse={handleSurveyResponse}
      />
    );
  };

  const renderSurvey = (surveyData: any) => {
    return (
      <Survey
        surveyData={surveyData}
        dialpadInput={dialpadInput}
        disabled={disabled}
        isSubmitting={isSubmitting}
        lastSubmissionStatus={lastSubmissionStatus}
        onDialpadInput={setDialpadInput}
        onSurveyResponse={handleSurveyResponse}
        onSubmitResponse={handleSubmitResponse}
      />
    );
  };

  // Helper methods for conditional rendering
  const shouldShowCallerForm = () => {
    return state.status === 'idle' && formConfig?.showFullForm !== false;
  };

  const shouldShowConnectButton = () => {
    return state.status === 'idle' && formConfig?.showFullForm === false;
  };

  const shouldShowCallLog = () => {
    return process.env.NODE_ENV === 'development' && 
           (state.status === 'in-call' || state.status === 'call-ended' || callLog.length > 0);
  };

  // Helper method for form validation
  const validateCallerData = () => {
    // If showFullForm is false, skip validation since no fields are shown
    if (formConfig?.showFullForm === false) {
      return { isValid: true, missingFields: [] };
    }

    // Check which fields are required based on form configuration
    const requiredFields = [];
    if (formConfig?.showPhone !== false) requiredFields.push('phone');
    if (formConfig?.showName !== false) requiredFields.push('name');
    if (formConfig?.showEmail !== false) requiredFields.push('email');
    
    // Check if all required fields are filled
    const missingFields = requiredFields.filter(field => !callerData[field as keyof CallerData]);
    
    return { isValid: missingFields.length === 0, missingFields };
  };

  const renderStatus = () => {
    switch (state.status) {
      case 'idle':
        return <IdleStatus formConfig={formConfig} />;
      
      case 'connecting':
        return <ConnectingStatus />;
      
      case 'connected':
        return (
          <ConnectedStatus
            formConfig={formConfig}
            colors={colors}
              disabled={disabled}
            onConnect={handleConnect}
          />
        );
      
      case 'in-call':
        return (
          <InCallStatus
            formConfig={formConfig}
              disabled={disabled}
            callLog={callLog}
            onDisconnect={handleDisconnect}
            renderSurvey={renderSurvey}
            renderElectoralDistrictSelection={renderElectoralDistrictSelection}
            renderElectoralPostcode={renderElectoralPostcode}
          />
        );
      
      case 'call-ended':
        return (
          <CallEndedStatus
            formConfig={formConfig}
            colors={colors}
              disabled={disabled}
            onReset={handleResetToIdle}
          />
        );
      
      case 'error':
        return (
          <ErrorStatus
            error={state.error}
                disabled={disabled}
            onRetry={() => setState({ status: 'idle', callLog: [] })}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div 
      className="bg-white rounded-lg"
    >
      {shouldShowCallerForm() && (
        <CallerForm
          callerData={callerData}
          formConfig={formConfig}
          colors={colors}
          disabled={disabled}
          validationErrors={validationErrors}
          onCallerDataChange={handleCallerDataChange}
          onConnect={handleConnect}
        />
      )}
      
      {renderStatus()}

      {shouldShowConnectButton() && (
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
      
      {/* Call Log - Show during and after calls in development */}
      {shouldShowCallLog() && (
        <div className="border-t border-gray-200">
          <CallLog callLog={callLog} />
        </div>
      )}
    </div>
  );
};
