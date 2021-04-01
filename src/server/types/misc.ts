export interface RostConfig {
  enableDebugMode: boolean;
  enableRadioModule: boolean;
  enablePhoneModule: boolean;
  enableGridModule: boolean;
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
