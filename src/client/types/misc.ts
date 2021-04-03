export interface VoiceConfig {
  debugMode: number;
  enableRadioModule: boolean;
  enablePhoneModule: boolean;
  enableNUIModule: boolean;
  enableRemoteClickOn: boolean;
  enableRemoteClickOff: boolean;
  cycleProximityHotkey: string;
  cycleFrequencyHotkey: string;
  toggleRadioHotkey: string;
  locale: string;
  voiceRanges: Array<VoiceProximity>;
}

export interface VoiceProximity {
  name: string;
  distance: number;
}

export interface PhoneCall {
  serverId: number;
  callId: string;
}

export interface RadioListener {
  serverId: number;
  transmitting: boolean;
}
export interface RadioChannel {
  radioId: string;
  listeners: Map<number, RadioListener>;
}
