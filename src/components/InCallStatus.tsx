import React from 'react';
import { FormConfig, CallLogEntry } from '../types';

interface InCallStatusProps {
  formConfig?: FormConfig;
  disabled?: boolean;
  callLog: CallLogEntry[];
  onDisconnect: () => void;
  renderSurvey: (data: any) => React.ReactNode;
  renderElectoralDistrictSelection: (data: any) => React.ReactNode;
  renderElectoralPostcode: (data: any) => React.ReactNode;
}

export const InCallStatus: React.FC<InCallStatusProps> = ({ 
  formConfig, 
  disabled = false, 
  callLog,
  onDisconnect,
  renderSurvey,
  renderElectoralDistrictSelection,
  renderElectoralPostcode
}) => {
  return (
    <div className="p-6">
      <div className="text-center mb-4">
        <div className="relative w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          {/* Spinning border - no pulse */}
          <div 
            className="absolute inset-0 rounded-full border-4 border-green-200 border-t-green-600 animate-spin" 
          ></div>
          {/* Call icon with pulse */}
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center animate-pulse relative z-10">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Call in Progress</h3>
        <p className="text-gray-600">You are currently on a call</p>
      </div>
      
      {(() => {
        // Get the latest call log entry to determine what interface to show
        const latestEntry = callLog.length > 0 ? callLog[callLog.length - 1] : null;
        
        // If the latest entry is a survey event, show survey interface
        if (latestEntry?.eventType === 'call_survey' && latestEntry?.data) {
          return renderSurvey(latestEntry.data);
        }
        
        // If the latest entry is a survey result event, show processing state
        if (latestEntry?.eventType === 'call_survey_result' && latestEntry?.data) {
          return (
            <div className="mt-4">
              <div className="mb-4">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-gray-800 font-medium">Processing your response...</p>
                  </div>
                </div>
              </div>
            </div>
          );
        }
        
        // If the latest entry is a select electorate event, show district selection interface
        if (latestEntry?.eventType === 'call_select_electorate' && latestEntry?.data) {
          return renderElectoralDistrictSelection(latestEntry.data);
        }
        
        // If the latest entry is an electoral postcode event, show dialpad interface
        if (latestEntry?.eventType === 'call_electoral_postcode' && latestEntry?.data) {
          return renderElectoralPostcode(latestEntry.data);
        }
        
        // If the latest entry is an electoral target event, show dialpad interface
        if (latestEntry?.eventType === 'call_electoral_target' && latestEntry?.data) {
          return renderElectoralPostcode(latestEntry.data);
        }
        
        // If the latest entry is a redirecting event, show redirecting status with target info
        if (latestEntry?.eventType === 'call_redirecting' && latestEntry?.data) {
          return (
            <div className="mt-4">
              <div className="mb-4">
                <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-orange-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <div>
                      <p className="text-gray-800 font-medium">{latestEntry.data.message || 'Redirecting to target'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        }
        
        // If the latest entry is a connected in conference event, show connected status with target info
        if (latestEntry?.eventType === 'call_connected_conference' && latestEntry?.data) {
          return (
            <div className="mt-4">
              <div className="mb-4">
                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <p className="text-gray-800 font-medium">{latestEntry.data.message || 'Connected to target'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        }
        
        // If the latest entry is an electoral lookup event, show district selection or processing state
        if (latestEntry?.eventType === 'call_electoral_lookup' && latestEntry?.data) {
          // Check if this is a district selection event (has districtsFound > 1)
          if (latestEntry.data.districtsFound && latestEntry.data.districtsFound > 1) {
            return renderElectoralDistrictSelection({
              districts: latestEntry.data.districts || [],
              message: latestEntry.data.message || 'Please select your district'
            });
          } else {
            return (
              <div className="mt-4">
                <div className="mb-4">
                  <div className="bg-purple-50 border border-purple-200 rounded-md p-3">
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p className="text-gray-800 font-medium">Looking up your representative...</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          }
        }
        
        // Otherwise, render nothing
        return null;
      })()}
      
      <button
        onClick={onDisconnect}
        disabled={disabled}
        className="w-full mt-4 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {formConfig?.cancelButtonText || 'End Call'}
      </button>
    </div>
  );
};
