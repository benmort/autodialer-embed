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
  // Layout options
  shadowBorder?: boolean;
  stretchToFit?: boolean;
  maxWidth?: number;
  minWidth?: number;
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
  tenant?: string;
  token?: string;
  call_type?: string;
}

export interface CallLogEntry {
  id: string;
  timestamp: Date;
  eventType: 'call_started' | 'call_connected' | 'call_ended' | 'call_disconnected' | 'call_error' | 
              'call_redirect' | 'call_redirecting' | 'call_connected_conference' | 'call_target_hangup' | 'call_electoral_postcode' | 'call_electoral_lookup' | 'call_electoral_target' | 
              'call_select_electorate' | 'call_survey' | 'call_survey_result';
  message: string;
  data?: any;
}

export interface AutodialerState {
  status: 'idle' | 'connecting' | 'connected' | 'in-call' | 'call-ended' | 'error';
  error?: string;
  callData?: CallerData;
  callLog: CallLogEntry[];
}

export interface AutodialerEvents {
  onStatusChange?: (status: AutodialerState['status']) => void;
  onError?: (error: string) => void;
  onCallStart?: (data: CallerData) => void;
  onCallEnd?: () => void;
  onCallLogUpdate?: (callLog: CallLogEntry[]) => void;
}

export interface AutodialerColors {
  primary: string;
  secondary: string;
  background?: string;
  text?: string;
}

export interface FormConfig {
  title?: string;
  description?: string;
  showPhone?: boolean;
  showName?: boolean;
  showEmail?: boolean;
  connectButtonText?: string;
  cancelButtonText?: string;
  callEndMessage?: string;
  showFullForm?: boolean;
  // Layout options
  shadowBorder?: boolean;
  stretchToFit?: boolean;
  maxWidth?: number;
  minWidth?: number;
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
  // Layout options
  shadowBorder?: boolean;
  stretchToFit?: boolean;
  maxWidth?: number;
  minWidth?: number;
  'on-status-change'?: string;
  'on-error'?: string;
  'on-call-start'?: string;
  'on-call-end'?: string;
}
