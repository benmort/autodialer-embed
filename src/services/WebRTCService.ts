import { Device, TwilioError } from '@twilio/voice-sdk';
import { PusherConfig, CallerData, AutodialerConfig } from '../types';

export class WebRTCService {
  private device: Device | null = null;
  private call: any = null;
  private twilioDestroyed = false;
  private twilioConnectionAlreadyLost = false;

  constructor(private config: AutodialerConfig) {}

  private getLogLevel(): "DEBUG" | "ERROR" {
    return process.env.NODE_ENV === 'development' ? "DEBUG" : "ERROR";
  }

  async initialize(): Promise<void> {
    if (!Device.isSupported) {
      throw new Error('Your browser is not currently supported. Please use a recent version of Firefox, Chrome, Edge or Safari.');
    }

    // Generate a unique identity for this session
    const identity = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Fetch Twilio token from backend
    const token = await this.fetchTwilioToken(identity);
    
    this.device = new Device(token, {
      logLevel: this.getLogLevel(),
      sounds: {
        // Custom incoming call sound (entry sound)
        incoming: `${import.meta.env.VITE_AUTODIALER_API_URL}/audio/didge1.wav`,
        // You can also customize other sounds
        outgoing: `${import.meta.env.VITE_AUTODIALER_API_URL}/audio/didge1.wav`,
        disconnect: `${import.meta.env.VITE_AUTODIALER_API_URL}/audio/didge2.wav`,
        // Disable DTMF sounds (set to empty strings to disable)
        dtmf0: `${import.meta.env.VITE_AUTODIALER_API_URL}/audio/silence.wav`,
        dtmf1: `${import.meta.env.VITE_AUTODIALER_API_URL}/audio/silence.wav`,
        dtmf2: `${import.meta.env.VITE_AUTODIALER_API_URL}/audio/silence.wav`,
        dtmf3: `${import.meta.env.VITE_AUTODIALER_API_URL}/audio/silence.wav`,
        dtmf4: `${import.meta.env.VITE_AUTODIALER_API_URL}/audio/silence.wav`,
        dtmf5: `${import.meta.env.VITE_AUTODIALER_API_URL}/audio/silence.wav`,
        dtmf6: `${import.meta.env.VITE_AUTODIALER_API_URL}/audio/silence.wav`,
        dtmf7: `${import.meta.env.VITE_AUTODIALER_API_URL}/audio/silence.wav`,
        dtmf8: `${import.meta.env.VITE_AUTODIALER_API_URL}/audio/silence.wav`,
        dtmf9: `${import.meta.env.VITE_AUTODIALER_API_URL}/audio/silence.wav`,
        dtmfs: `${import.meta.env.VITE_AUTODIALER_API_URL}/audio/silence.wav`, // DTMF star (*) sound
        dtmfh: `${import.meta.env.VITE_AUTODIALER_API_URL}/audio/silence.wav`  // DTMF hash (#) sound
      }
    });

    this.device.on('error', this.handleTwilioError.bind(this));
  }

  private async fetchTwilioToken(identity: string): Promise<string> {
    try {
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
      
      // Decode and validate the token structure
      try {
        const parts = data.token.split('.');
        if (parts.length === 3) {
          // Token structure validated
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
      this.call = await this.device.connect({
        params: {
          From: data.phone,
          name: data.name,
          email: data.email,
          callerChannelId: data.caller_channel_id,
          pusherAppId: pusherConfig.appId,
          call_type: 'webrtc',
          ...(data.tenant ? { tenant: data.tenant } : {}),
          ...(data.token ? { token: data.token } : {}),
          ...(data.referralCode !== undefined ? { referralCode: data.referralCode } : {}),
        }
      });

      this.call.on('error', this.handleTwilioError.bind(this));
    } catch (error) {
      console.error('Failed to connect call:', error);
      throw error;
    }
  }

  async sendDTMF(digits: string): Promise<void> {
    if (!this.call) {
      throw new Error('No active call to send DTMF tones');
    }

    try {
      // Use Twilio Voice SDK's built-in sendDigits method
      this.call.sendDigits(digits);
      
    } catch (error) {
      console.error('❌ Failed to send DTMF tones:', error);
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
    this.call = null;
  }

  // Event handlers - will be set by the main service
  onError?: (message: string) => void;
  onConnectionLost?: (message: string) => void;
}
