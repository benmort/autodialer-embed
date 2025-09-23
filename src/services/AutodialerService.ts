import { WebRTCService } from './WebRTCService';
import { PusherService } from './PusherService';
import { AutodialerConfig, AutodialerState, AutodialerEvents, CallerData } from '../types';

export class AutodialerService {
  private webRTCService: WebRTCService;
  private pusherService: PusherService;
  private state: AutodialerState = { status: 'idle' };
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

  private handlePusherMessage(eventName: string, data: any): void {
    switch (eventName) {
      case 'call_started':
        this.updateState({ status: 'in-call' });
        this.events.onCallStart?.(data);
        break;
      case 'call_ended':
        this.updateState({ status: 'call-ended' });
        this.events.onCallEnd?.();
        break;
      case 'error':
        this.updateState({ status: 'error', error: data.message });
        this.events.onError?.(data.message);
        break;
      default:
        console.log('Unhandled pusher message:', eventName, data);
    }
  }

  private updateState(newState: Partial<AutodialerState>): void {
    this.state = { ...this.state, ...newState };
    this.events.onStatusChange?.(this.state.status);
  }

  async connect(callerData: CallerData): Promise<void> {
    try {
      this.updateState({ status: 'connecting' });

      // Add campaign ID to caller data if specified
      const enrichedCallerData = {
        ...callerData,
        campaignId: this.config.campaignId
      };

      // Connect to Pusher first
      const pusherConfig = await this.pusherService.connect();
      
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
    this.updateState({ status: 'call-ended' });
  }

  async sendResponse(response: string): Promise<void> {
    try {
      console.log('Sending response:', response, 'Caller channel ID:', this.state.callData?.caller_channel_id);
      
      // Send response via Pusher with a unique event name for each response
      const eventName = `caller_response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await this.pusherService.sendMessage(eventName, {
        response: response,
        callerChannelId: this.state.callData?.caller_channel_id,
        timestamp: Date.now()
      });
      
      console.log('Response sent successfully:', response);
    } catch (error) {
      console.error('Failed to send response:', error);
      throw error;
    }
  }
}
