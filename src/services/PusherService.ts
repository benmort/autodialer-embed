import Pusher, { Channel } from 'pusher-js';
import { PusherConfig, AutodialerConfig } from '../types';

type PusherState = 'initialized' | 'connecting' | 'connected' | 'disconnected' | 'unavailable' | 'failed';

export class PusherService {
  private pusher: Pusher | null = null;
  private channel: Channel | null = null;
  private pusherTimeoutId: NodeJS.Timeout | undefined;

  constructor(private config: AutodialerConfig) {}

  async connect(): Promise<PusherConfig> {
    // Check if this is demo mode (using placeholder credentials)
    const isDemoMode = this.config.pusherConfigs.some(config => 
      config.key === 'default-key' || config.appId === 'default'
    );

    if (isDemoMode) {
      console.log('Demo mode: Skipping Pusher connection');
      // Return a mock config for demo purposes
      const mockConfig = this.config.pusherConfigs[0];
      this.startMockSubscriptions();
      return mockConfig;
    }

    // Race multiple pusher configs to find the fastest connection
    const connectionPromises = this.config.pusherConfigs.map(config => 
      this.connectToPusher(config)
    );

    try {
      const result = await Promise.race(connectionPromises);
      this.startSubscriptions();
      return result;
    } catch (error) {
      console.error('All pusher connections failed:', error);
      throw new Error('Failed to connect to messaging service');
    }
  }

  private async connectToPusher(pusherConfig: PusherConfig): Promise<PusherConfig> {
    const pusherAuthUrl = `${this.config.backendUrl}/pusher/auth?tenant=${this.config.tenant}&token=${this.config.token}&app_id=${pusherConfig.appId}`;

    const pusher = new Pusher(pusherConfig.key, {
      cluster: pusherConfig.cluster,
      forceTLS: true,
      channelAuthorization: {
        endpoint: pusherAuthUrl,
        transport: 'ajax',
        headers: localStorage.getItem('wafCaptchaToken')
          ? { 'x-aws-waf-token': localStorage.getItem('wafCaptchaToken') }
          : {},
      },
    });

    const channel = pusher.subscribe(
      ['private-caller', this.config.tenant, this.config.token, this.config.callerChannelId].join('-')
    );

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Pusher connection timeout'));
      }, 10000);

      function tearDown() {
        clearTimeout(timeout);
        pusher.connection.unbind('state_change');
        pusher.connection.unbind('error');
        channel.unbind('pusher:subscription_succeeded');
        channel.unbind('pusher:subscription_error');
      }

      pusher.connection.bind('state_change', (states: { current: PusherState; previous: PusherState }) => {
        if (['failed', 'disconnected', 'unavailable'].includes(states.current)) {
          tearDown();
          reject(new Error(`Pusher connection failed; state: ${states.current}`));
        }
      });

      pusher.connection.bind('error', (error: Error) => {
        tearDown();
        reject(error);
      });

      channel.bind('pusher:subscription_succeeded', () => {
        tearDown();
        this.pusher = pusher;
        this.channel = channel;
        resolve(pusherConfig);
      });

      channel.bind('pusher:subscription_error', (data: any) => {
        tearDown();
        reject(new Error(`Pusher subscription error: ${JSON.stringify(data)}`));
      });
    });
  }

  private startMockSubscriptions(): void {
    console.log('Demo mode: Starting mock Pusher subscriptions');
    // In demo mode, we don't need real Pusher connections
    // Just simulate a successful connection
  }

  private startSubscriptions(): void {
    if (!this.pusher || !this.channel) return;

    // Handle connection state changes
    this.pusher.connection.bind('state_change', (states: { current: PusherState; previous: PusherState }) => {
      switch (states.current) {
        case 'failed':
          this.onConnectionLost?.('Failed to establish connection');
          break;
        case 'unavailable':
          if (!this.pusherTimeoutId) {
            this.pusherTimeoutId = setTimeout(() => {
              this.onConnectionLost?.('Connection timeout - please check your network');
            }, 30000);
          }
          break;
        default:
          if (this.pusherTimeoutId) {
            clearTimeout(this.pusherTimeoutId);
            this.pusherTimeoutId = undefined;
          }
          break;
      }
    });

    // Handle channel events
    this.channel.bind_global((eventName: string, data: any) => {
      if (eventName === 'pusher:subscription_error') {
        this.onConnectionLost?.('Subscription error occurred');
      } else if (!eventName.match(/^pusher/)) {
        this.onMessage?.(eventName, data);
      }
    });
  }

  disconnect(): void {
    if (this.pusherTimeoutId) {
      clearTimeout(this.pusherTimeoutId);
      this.pusherTimeoutId = undefined;
    }

    if (this.pusher) {
      this.pusher.disconnect();
      this.pusher = null;
      this.channel = null;
    }
  }

  // Event handlers - will be set by the main service
  onMessage?: (eventName: string, data: any) => void;
  onConnectionLost?: (message: string) => void;
}
