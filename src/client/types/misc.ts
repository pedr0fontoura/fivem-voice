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
    voiceRanges: Array<VoiceProximity>;
}

export interface VoiceProximity {
    name: string;
    distance: number;
}

export interface PhoneCall {
    serverID: number;
    playerID: number;
    callID: string;
}

export interface RadioListener {
    playerID: number;
    serverID: number;
    transmitting: boolean;
}
export interface RadioChannel {
    radioID: string;
    listeners: Map<number, RadioListener>;
}
