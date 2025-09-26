import { WebRTCService } from './WebRTCService';
import { PusherService } from './PusherService';
import { AutodialerConfig, AutodialerState, AutodialerEvents, CallerData, CallLogEntry } from '../types';

export class AutodialerService {
  private webRTCService: WebRTCService;
  private pusherService: PusherService;
  private state: AutodialerState = { status: 'idle', callLog: [] };
  private events: AutodialerEvents = {};

  constructor(private config: AutodialerConfig) {
    this.webRTCService = new WebRTCService(config);
    this.pusherService = new PusherService(config);
    
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.webRTCService.onError = (message: string) => {
      this.updateState({ status: 'error', error: message });
      this.events.onError?.(message);
    };

    this.webRTCService.onConnectionLost = (message: string) => {
      this.updateState({ status: 'error', error: message });
      this.events.onError?.(message);
    };

    this.pusherService.onMessage = (eventName: string, data: any) => {
      this.handlePusherMessage(eventName, data);
    };

    this.pusherService.onConnectionLost = (message: string) => {
      this.updateState({ status: 'error', error: message });
      this.events.onError?.(message);
    };
  }

  private addCallLogEntry(eventType: CallLogEntry['eventType'], message: string, data?: any): void {
    const entry: CallLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      eventType,
      message,
      data
    };
    
    this.state.callLog.push(entry);
    this.events.onCallLogUpdate?.(this.state.callLog);
  }

  private handlePusherMessage(eventName: string, data: any): void {
    switch (eventName) {
      case 'call_started':
        this.updateState({ status: 'in-call' });
        this.addCallLogEntry('call_started', 'Call started', data);
        this.events.onCallStart?.(data);
        break;
      case 'call_connected':
        this.addCallLogEntry('call_connected', data.message || 'Call connected', data);
        break;
      case 'call_ended':
        this.updateState({ status: 'call-ended' });
        this.addCallLogEntry('call_ended', 'Call ended', data);
        this.events.onCallEnd?.();
        break;
      case 'call_disconnected':
        this.addCallLogEntry('call_disconnected', 'Call disconnected', data);
        break;
      case 'error':
        this.updateState({ status: 'error', error: data.message });
        this.addCallLogEntry('call_error', data.message || 'Call error', data);
        this.events.onError?.(data.message);
        break;
      case 'call_redirect':
        this.addCallLogEntry('call_redirect', data.message || 'Redirecting call', data);
        break;
      case 'call_redirecting':
        this.addCallLogEntry('call_redirecting', data.message || 'Redirecting to target', data);
        break;
      case 'call_connected_conference':
        this.addCallLogEntry('call_connected_conference', data.message || 'Connected to target', data);
        break;
      case 'call_target_hangup':
        this.addCallLogEntry('call_target_hangup', data.message || 'Representative has left the call', data);
        break;
      case 'call_electoral_postcode':
        this.addCallLogEntry('call_electoral_postcode', data.message || 'Entering postcode', data);
        break;
      case 'call_electoral_lookup':
        this.addCallLogEntry('call_electoral_lookup', data.message || 'Looking up postcode', data);
        break;
      case 'call_electoral_target':
        this.addCallLogEntry('call_electoral_target', data.message || 'Connecting to representative', data);
        break;
      case 'call_select_electorate':
        this.addCallLogEntry('call_select_electorate', data.message || 'Selecting electorate', data);
        break;
      case 'call_survey':
        this.addCallLogEntry('call_survey', data.message || 'Survey question', data);
        break;
      case 'call_survey_result':
        this.addCallLogEntry('call_survey_result', data.message || 'Survey response', data);
        break;
      default:
        break;
    }
  }

  private updateState(newState: Partial<AutodialerState>): void {
    this.state = { ...this.state, ...newState };
    this.events.onStatusChange?.(this.state.status);
  }

  async connect(callerData: CallerData): Promise<void> {
    try {
      this.updateState({ status: 'connecting' });

      // Add campaign ID and Pusher channel parameters to caller data if specified
      const enrichedCallerData = {
        ...callerData,
        campaignId: this.config.campaignId,
        tenant: this.config.tenant,
        token: this.config.token,
        caller_channel_id: this.config.callerChannelId,
        call_type: 'webrtc' // Mark this as a WebRTC call
      };

      // Connect to Pusher first
      const pusherConfig = await this.pusherService.connect();
      
      // Add initial call log entry
      this.addCallLogEntry('call_started', 'Starting call connection...', { 
        timestamp: new Date().toISOString(),
        callerData: enrichedCallerData 
      });
      
      // If using WebRTC (not dial-in), connect to Twilio
      if (!this.config.dialIn) {
        await this.webRTCService.initialize();
        await this.webRTCService.connect(enrichedCallerData, pusherConfig);
        // Call is starting, transition to in-call state
        this.updateState({ status: 'in-call', callData: enrichedCallerData });
        this.events.onCallStart?.(enrichedCallerData);
      } else {
        this.updateState({ status: 'connected', callData: enrichedCallerData });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      this.addCallLogEntry('call_error', `Connection failed: ${errorMessage}`, { 
        error: errorMessage,
        timestamp: new Date().toISOString() 
      });
      this.updateState({ status: 'error', error: errorMessage });
      this.events.onError?.(errorMessage);
      throw error;
    }
  }

  disconnect(): void {
    this.webRTCService.destroy();
    this.pusherService.disconnect();
    this.updateState({ status: 'idle' });
  }

  getState(): AutodialerState {
    return { ...this.state };
  }

  getCallLog(): CallLogEntry[] {
    return [...this.state.callLog];
  }

  setEvents(events: AutodialerEvents): void {
    this.events = { ...this.events, ...events };
  }

  // API methods for external control
  async startCall(callerData: CallerData): Promise<void> {
    await this.connect(callerData);
  }

  endCall(): void {
    this.webRTCService.destroy();
    this.pusherService.disconnect();
    this.updateState({ status: 'call-ended', callLog: [] });
  }

  async sendResponse(response: string): Promise<void> {
    try {
      // For WebRTC calls, send DTMF tones directly to Twilio
      // This will trigger the existing /survey_result endpoint just like phone calls
      if (this.state.callData?.call_type === 'webrtc') {
        await this.webRTCService.sendDTMF(response);
      } else {
        // Fallback to Pusher for other call types (if any)
        const eventName = `caller_response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await this.pusherService.sendMessage(eventName, {
          response: response,
          callerChannelId: this.state.callData?.caller_channel_id,
          timestamp: Date.now()
        });
      }
      
    } catch (error) {
      console.error('Failed to send response:', error);
      throw error;
    }
  }
}
