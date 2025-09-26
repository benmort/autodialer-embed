import React, { useState } from 'react';
import { CallLogEntry } from '../types';

interface CallLogProps {
  callLog: CallLogEntry[];
  className?: string;
}

const getEventIcon = (eventType: CallLogEntry['eventType']): string => {
  switch (eventType) {
    case 'call_started':
      return '🚀';
    case 'call_connected':
      return '✅';
    case 'call_ended':
      return '📴';
    case 'call_disconnected':
      return '❌';
    case 'call_error':
      return '⚠️';
    case 'call_redirect':
      return '🔄';
    case 'call_redirecting':
      return '🔄';
    case 'call_connected_conference':
      return '✅';
    case 'call_electoral_postcode':
      return '📮';
    case 'call_electoral_lookup':
      return '🔍';
    case 'call_electoral_target':
      return '📞';
    case 'call_select_electorate':
      return '🗳️';
    case 'call_survey':
      return '📊';
    case 'call_survey_result':
      return '✏️';
    default:
      return '📝';
  }
};

const getEventColor = (eventType: CallLogEntry['eventType']): string => {
  switch (eventType) {
    case 'call_started':
    case 'call_connected':
      return 'text-green-600';
    case 'call_ended':
    case 'call_disconnected':
      return 'text-gray-600';
    case 'call_error':
      return 'text-red-600';
    case 'call_redirect':
    case 'call_redirecting':
    case 'call_electoral_target':
      return 'text-blue-600';
    case 'call_connected_conference':
      return 'text-green-600';
    case 'call_electoral_postcode':
    case 'call_electoral_lookup':
      return 'text-purple-600';
    case 'call_select_electorate':
      return 'text-indigo-600';
    case 'call_survey':
    case 'call_survey_result':
      return 'text-orange-600';
    default:
      return 'text-gray-600';
  }
};

const formatTimestamp = (timestamp: Date): string => {
  return timestamp.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

export const CallLog: React.FC<CallLogProps> = ({ callLog, className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (callLog.length === 0) {
    return (
      <div className={`p-4 text-center text-gray-500 ${className}`}>
        <div className="text-2xl mb-2">📋</div>
        <div className="text-sm">Call log will appear here during your call</div>
        <div className="text-xs text-gray-400 mt-2">Debug: callLog.length = {callLog.length}</div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 border-b border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900 flex items-center">
            <span className="mr-2">📋</span>
            Call Log ({callLog.length} events)
          </h3>
          <svg 
            className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      
      {isExpanded && (
        <div className="max-h-96 overflow-y-auto">
        <div className="divide-y divide-gray-100">
          {callLog.map((entry) => (
            <div key={entry.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <span className="text-lg">{getEventIcon(entry.eventType)}</span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-medium ${getEventColor(entry.eventType)}`}>
                      {entry.message}
                    </p>
                    <p className="text-xs text-gray-500 ml-2 flex-shrink-0">
                      {formatTimestamp(entry.timestamp)}
                    </p>
                  </div>
                  
                  {entry.data && (
                    <div className="mt-1">
                      <details className="text-xs">
                        <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                          View details
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                          {JSON.stringify(entry.data, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        </div>
      )}
      
      {isExpanded && callLog.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-500">
          <div className="flex justify-between items-center">
            <span>Last updated: {formatTimestamp(callLog[callLog.length - 1].timestamp)}</span>
            <span>Scroll to see all events</span>
          </div>
        </div>
      )}
    </div>
  );
};
