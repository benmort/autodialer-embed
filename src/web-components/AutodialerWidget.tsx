import React from 'react';
import { createRoot } from 'react-dom/client';
import { AutodialerService } from '../services/AutodialerService';
import { DialerInterface } from '../components/DialerInterface';
import { AutodialerConfig, AutodialerElement } from '../types';

export class AutodialerWidget extends HTMLElement {
  private service: AutodialerService | null = null;
  private root: any = null;

  constructor() {
    super();
  }

  // Getters for attributes
  get tenant() { return this.getAttribute('tenant') || undefined; }
  get token() { return this.getAttribute('token') || undefined; }
  get phone() { return this.getAttribute('phone') || undefined; }
  get name() { return this.getAttribute('name') || undefined; }
  get email() { return this.getAttribute('email') || undefined; }
  get campaignId() { return this.getAttribute('campaign-id') || undefined; }
  get primaryColor() { return this.getAttribute('primary-color') || undefined; }
  get secondaryColor() { return this.getAttribute('secondary-color') || undefined; }
  get backgroundColor() { return this.getAttribute('background-color') || undefined; }
  get textColor() { return this.getAttribute('text-color') || undefined; }
  get disabled() { return this.hasAttribute('disabled'); }
  get formTitle() { return this.getAttribute('form-title') || undefined; }
  get formDescription() { return this.getAttribute('form-description') || undefined; }
  get showPhone() { return this.hasAttribute('show-phone'); }
  get showName() { return this.hasAttribute('show-name'); }
  get showEmail() { return this.hasAttribute('show-email'); }
  get connectButtonText() { return this.getAttribute('connect-button-text') || undefined; }
  get cancelButtonText() { return this.getAttribute('cancel-button-text') || undefined; }
  get callEndMessage() { return this.getAttribute('call-end-message') || undefined; }
  get showFullForm() { return this.hasAttribute('show-full-form'); }
  get shadowBorder() { return this.getAttribute('shadow-border') === 'true'; }
  get stretchToFit() { return this.getAttribute('stretch-to-fit') === 'true'; }
  get maxWidth() { return this.getAttribute('max-width') ? parseInt(this.getAttribute('max-width')!) : undefined; }
  get minWidth() { return this.getAttribute('min-width') ? parseInt(this.getAttribute('min-width')!) : undefined; }
  get 'on-status-change'() { return this.getAttribute('on-status-change') || undefined; }
  get 'on-error'() { return this.getAttribute('on-error') || undefined; }
  get 'on-call-start'() { return this.getAttribute('on-call-start') || undefined; }
  get 'on-call-end'() { return this.getAttribute('on-call-end') || undefined; }

  static get observedAttributes() {
    return [
      'tenant',
      'token',
      'phone',
      'name',
      'email',
      'campaign-id',
      'primary-color',
      'secondary-color',
      'background-color',
      'text-color',
      'disabled',
      'form-title',
      'form-description',
      'show-phone',
      'show-name',
      'show-email',
      'connect-button-text',
      'cancel-button-text',
      'call-end-message',
      'show-full-form',
      'shadow-border',
      'stretch-to-fit',
      'max-width',
      'min-width',
      'on-status-change',
      'on-error',
      'on-call-start',
      'on-call-end'
    ];
  }

  connectedCallback() {
    this.initialize();
  }

  disconnectedCallback() {
    this.cleanup();
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue !== newValue && this.service) {
      // Reinitialize if critical config changed
      if (['tenant', 'token', 'campaign-id'].includes(name)) {
        this.cleanup();
        this.initialize();
      } else if (['form-title', 'form-description', 'show-phone', 'show-name', 'show-email', 'connect-button-text', 'cancel-button-text', 'call-end-message', 'show-full-form'].includes(name)) {
        // Just re-render for form config changes
        this.render();
      } else if (['primary-color', 'secondary-color', 'background-color', 'text-color', 'shadow-border', 'stretch-to-fit', 'max-width', 'min-width'].includes(name)) {
        // Reapply styles for color and layout changes
        this.applyLayoutStyles();
      }
    }
  }

  private initialize() {
    try {
      const config = this.getConfig();
      this.service = new AutodialerService(config);
      
      this.applyLayoutStyles();
      this.render();
      this.setupEventListeners();
    } catch (error) {
      console.error('Failed to initialize AutodialerWidget:', error);
      this.renderError(error instanceof Error ? error.message : 'Initialization failed');
    }
  }

  private applyLayoutStyles() {
    const element = this as unknown as AutodialerElement;
    
    // Apply shadow border
    if (element.shadowBorder) {
      this.classList.add('shadow-lg');
    } else {
      this.classList.remove('shadow-lg');
    }
    
    // Apply stretch to fit
    if (element.stretchToFit) {
      this.style.width = '100%';
      this.style.maxWidth = 'none';
      this.style.minWidth = 'none';
    } else {
      this.style.width = '';
      this.style.maxWidth = element.maxWidth ? `${element.maxWidth}px` : '';
      this.style.minWidth = element.minWidth ? `${element.minWidth}px` : '';
    }
    
    // Apply color styles
    if (element.primaryColor) {
      this.style.setProperty('--autodialer-primary', element.primaryColor);
    }
    if (element.secondaryColor) {
      this.style.setProperty('--autodialer-secondary', element.secondaryColor);
    }
    if (element.backgroundColor) {
      this.style.setProperty('--autodialer-background', element.backgroundColor);
    }
    if (element.textColor) {
      this.style.setProperty('--autodialer-text', element.textColor);
    }
    
    // Add base styles
    this.style.display = 'block';
    this.style.margin = '0 auto';
  }

  private getConfig(): AutodialerConfig {
    const element = this as unknown as AutodialerElement;
    
    
    if (!element.tenant || !element.token) {
      throw new Error('Missing required attributes: tenant, token');
    }

    // Get backend URL from environment variable
    const backendUrl = import.meta.env.VITE_AUTODIALER_API_URL || 'http://localhost:5001';

    // Get Pusher configuration from environment variables
    const pusherConfigs = [
      {
        appId: import.meta.env.VITE_PUSHER_APP_ID || 'default',
        cluster: import.meta.env.VITE_PUSHER_CLUSTER || 'us2',
        key: import.meta.env.VITE_PUSHER_KEY || 'default-key'
      }
    ];

    // Warn about missing Pusher configuration
    const hasValidPusherConfig = pusherConfigs.some(config => 
      config.appId !== 'default' && config.key !== 'default-key'
    );
    
    if (!hasValidPusherConfig) {
      console.warn('⚠️ Using default Pusher configuration. Set VITE_PUSHER_* environment variables for production.');
    }

    return {
      tenant: element.tenant,
      token: element.token,
      backendUrl: backendUrl,
      campaignId: element.campaignId,
      pusherConfigs: pusherConfigs,
      callerChannelId: this.generateCallerChannelId(),
      dialIn: false, // Always use WebRTC mode since we fetch tokens dynamically
      colors: {
        primary: element.primaryColor || '#6b7280',
        secondary: element.secondaryColor || '#9ca3af',
        background: element.backgroundColor,
        text: element.textColor
      },
      // Layout options
      shadowBorder: element.shadowBorder,
      stretchToFit: element.stretchToFit,
      maxWidth: element.maxWidth,
      minWidth: element.minWidth
    };
  }

  private generateCallerChannelId(): string {
    return `caller-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupEventListeners() {
    if (!this.service) return;

    const element = this as unknown as AutodialerElement;
    
    this.service.setEvents({
      onStatusChange: (status) => {
        this.dispatchCustomEvent('status-change', { status });
        this.callCustomHandler(element['on-status-change'], { status });
      },
      onError: (error) => {
        this.dispatchCustomEvent('error', { error });
        this.callCustomHandler(element['on-error'], { error });
      },
      onCallStart: (data) => {
        this.dispatchCustomEvent('call-start', { data });
        this.callCustomHandler(element['on-call-start'], { data });
      },
      onCallEnd: () => {
        this.dispatchCustomEvent('call-end', {});
        this.callCustomHandler(element['on-call-end'], {});
      }
    });
  }

  private dispatchCustomEvent(eventName: string, detail: any) {
    const event = new CustomEvent(eventName, { detail });
    super.dispatchEvent(event);
  }

  private callCustomHandler(handlerName: string | undefined, data: any) {
    if (handlerName && typeof window[handlerName as keyof Window] === 'function') {
      try {
        (window[handlerName as keyof Window] as Function)(data);
      } catch (error) {
        console.error(`Error calling custom handler ${handlerName}:`, error);
      }
    }
  }

  private render() {
    if (!this.service) return;

    const element = this as unknown as AutodialerElement;
    const initialData = {
      phone: element.phone,
      name: element.name,
      email: element.email
    };

    this.root = createRoot(this);
    this.root.render(
      React.createElement(DialerInterface, {
        service: this.service,
        initialData,
        colors: this.service ? this.getConfig().colors : undefined,
        disabled: element.disabled,
        formConfig: {
          title: element.formTitle,
          description: element.formDescription,
          showPhone: element.showPhone,
          showName: element.showName,
          showEmail: element.showEmail,
          connectButtonText: element.connectButtonText,
          cancelButtonText: element.cancelButtonText,
          callEndMessage: element.callEndMessage,
          showFullForm: (element as any).showFullForm
        } as any
      })
    );
  }

  private renderError(message: string) {
    this.root = createRoot(this);
    this.root.render(
      React.createElement('div', {
        className: 'bg-red-50 border border-red-200 rounded-md p-4 text-center'
      }, [
        React.createElement('div', {
          key: 'icon',
          className: 'w-8 h-8 bg-red-100 rounded-full mx-auto mb-2 flex items-center justify-center'
        }, React.createElement('svg', {
          className: 'w-5 h-5 text-red-600',
          fill: 'none',
          stroke: 'currentColor',
          viewBox: '0 0 24 24'
        }, React.createElement('path', {
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          strokeWidth: 2,
          d: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
        }))),
        React.createElement('p', {
          key: 'message',
          className: 'text-red-700 text-sm'
        }, message)
      ])
    );
  }

  private cleanup() {
    if (this.service) {
      this.service.disconnect();
      this.service = null;
    }
    
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
  }

  // Public API methods
  public connect(data: { phone: string; name: string; email: string; referralCode?: string }) {
    if (!this.service) {
      throw new Error('Widget not initialized');
    }
    return this.service.startCall({
      ...data,
      caller_channel_id: this.generateCallerChannelId()
    });
  }

  public disconnect() {
    if (!this.service) {
      throw new Error('Widget not initialized');
    }
    this.service.endCall();
  }

  public getStatus() {
    return this.service?.getState() || { status: 'idle' };
  }
}

// Register the custom element
if (!customElements.get('autodialer-widget')) {
  customElements.define('autodialer-widget', AutodialerWidget);
}
