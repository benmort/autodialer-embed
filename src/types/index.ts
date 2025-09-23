// Core types for the embeddable autodialer

export interface AutodialerConfig {
  tenant: string;
  token: string;
  backendUrl: string;
  pusherConfigs: PusherConfig[];
  twilioToken?: string;
  callerChannelId: string;
  dialIn?: boolean;
  phone?: string;
  name?: string;
  email?: string;
  referralCode?: string;
  campaignId?: string;
  colors?: AutodialerColors;
}

export interface PusherConfig {
  appId: string;
  cluster: string;
  key: string;
}

export interface CallerData {
  phone: string;
  name: string;
  email: string;
  caller_channel_id: string;
  referralCode?: string;
  campaignId?: string;
}

export interface AutodialerState {
  status: 'idle' | 'connecting' | 'connected' | 'in-call' | 'call-ended' | 'error';
  error?: string;
  callData?: CallerData;
}

export interface AutodialerEvents {
  onStatusChange?: (status: AutodialerState['status']) => void;
  onError?: (error: string) => void;
  onCallStart?: (data: CallerData) => void;
  onCallEnd?: () => void;
}

export interface AutodialerColors {
  primary: string;
  secondary: string;
  background?: string;
  text?: string;
}

// Web Component attributes
export interface AutodialerElement extends HTMLElement {
  tenant?: string;
  token?: string;
  phone?: string;
  name?: string;
  email?: string;
  campaignId?: string;
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  disabled?: boolean;
  formTitle?: string;
  formDescription?: string;
  showPhone?: boolean;
  showName?: boolean;
  showEmail?: boolean;
  connectButtonText?: string;
  cancelButtonText?: string;
  callEndMessage?: string;
  showFullForm?: boolean;
  'on-status-change'?: string;
  'on-error'?: string;
  'on-call-start'?: string;
  'on-call-end'?: string;
}
