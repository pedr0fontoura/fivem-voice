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
}

export interface RadioListener {
  serverId: number;
  transmitting: boolean;
}

export interface PhoneCall {
  callId: string;
  playerA: number;
  playerB: number;
}
