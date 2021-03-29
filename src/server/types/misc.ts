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
  serverID: number;
  transmitting: boolean;
}

export interface PhoneCall {
  callID: string;
  playerA: number;
  playerB: number;
}
