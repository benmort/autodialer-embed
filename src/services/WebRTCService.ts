import { Device, TwilioError } from '@twilio/voice-sdk';
import { PusherConfig, CallerData, AutodialerConfig } from '../types';

export class WebRTCService {
  private device: Device | null = null;
  private twilioDestroyed = false;
  private twilioConnectionAlreadyLost = false;

  constructor(private config: AutodialerConfig) {}

  async initialize(): Promise<void> {
    if (!Device.isSupported) {
      throw new Error('Your browser is not currently supported. Please use a recent version of Firefox, Chrome, Edge or Safari.');
    }

    // Generate a unique identity for this session
    const identity = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Fetch Twilio token from backend
    const token = await this.fetchTwilioToken(identity);
    
    this.device = new Device(token, {
      logLevel: "DEBUG", // Use string like dialer-ui project
      // Remove all other parameters - let SDK auto-detect and use defaults
    });

    this.device.on('error', this.handleTwilioError.bind(this));
  }

  private async fetchTwilioToken(identity: string): Promise<string> {
    try {
      console.log(`🔄 Fetching Twilio token for identity: ${identity}`);
      
      const response = await fetch(`${this.config.backendUrl}/api/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identity: identity,
          campaignId: this.config.campaignId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Token fetch failed: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`Failed to fetch Twilio token: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.token) {
        throw new Error('No token received from backend');
      }
      
      console.log(`✅ Successfully obtained Twilio token`);
      console.log(`🔍 Token length: ${data.token.length}`);
      console.log(`🔍 Token preview: ${data.token.substring(0, 50)}...`);
      
      // Decode and validate the token structure
      try {
        const parts = data.token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          console.log(`🔍 Token payload:`, {
            iss: payload.iss,
            sub: payload.sub,
            iat: payload.iat,
            exp: payload.exp,
            grants: payload.grants
          });
        }
      } catch (e) {
        console.warn('⚠️ Could not decode token for debugging:', e);
      }
      
      return data.token;
    } catch (error) {
      console.error('❌ Error fetching Twilio token:', error);
      throw new Error(`Failed to obtain Twilio access token from backend: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async connect(data: CallerData, pusherConfig: PusherConfig): Promise<void> {
    if (!this.device) {
      throw new Error('Device not initialized');
    }

    try {
      const call = await this.device.connect({
        params: {
          From: data.phone,
          name: data.name,
          email: data.email,
          callerChannelId: data.caller_channel_id,
          pusherAppId: pusherConfig.appId,
          call_type: 'webrtc',
          ...(data.referralCode !== undefined ? { referralCode: data.referralCode } : {}),
        },
      });

      call.on('error', this.handleTwilioError.bind(this));
    } catch (error) {
      console.error('Failed to connect call:', error);
      throw error;
    }
  }

  private handleTwilioError(twilioError: TwilioError.TwilioError): void {
    if (this.twilioConnectionAlreadyLost) {
      return;
    }

    const message = `Telephony error ${twilioError?.code || 'unknown'}: ${
      twilioError?.description || twilioError?.message || 'Unknown error'
    }. Please report an issue if this is a persistent problem.`;

    console.error('Twilio error:', twilioError);

    // Handle specific error codes
    if (twilioError && [31000, 53000, 53405, 31009, 31005].includes(twilioError.code)) {
      this.onConnectionLost?.(message);
    } else if (twilioError && twilioError.code === 31401) {
      this.onError?.('Permission is denied to your microphone. Please accept the permission if prompted, or update the permissions in your web browser.');
    } else if (twilioError && twilioError.code === 31402) {
      this.onError?.('Connection lost to your audio hardware. Check that your microphone and speakers are connected.');
    } else {
      this.onError?.(message);
    }

    this.twilioConnectionAlreadyLost = true;
    this.destroy();
  }

  destroy(): void {
    if (this.device && !this.twilioDestroyed) {
      this.twilioDestroyed = true;
      this.device.destroy();
      this.device = null;
    }
  }

  // Event handlers - will be set by the main service
  onError?: (message: string) => void;
  onConnectionLost?: (message: string) => void;
}
