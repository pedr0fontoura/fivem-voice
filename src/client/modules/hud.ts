import { Config } from '../index';
import { RadioChannel } from '../types/misc';

let IsVoiceActive = false;

export async function UpdateHUD(payload): Promise<void> {
  if (!Config.enableNUIModule) return;

  SendNuiMessage(JSON.stringify(payload));
}

export function UpdateHUDProximity(range: string): void {
  UpdateHUD({ type: 'proximity', proximity: range });
}

export function UpdateRadioPowerState(state: boolean): void {
  UpdateHUD({ type: 'radioPowerState', state: state });
}

export function UpdateRadioTransmitting(transmitting: boolean): void {
  UpdateHUD({ type: 'radioTransmission', status: transmitting });
}

export function UpdateRadioFrequency(channelData: RadioChannel): void {
  UpdateHUD({ type: 'frequency', frequency: channelData.radioID });
}

export function PlayRemoteRadioClick(transmitting): void {
  if (
    (transmitting && !Config.enableRemoteClickOn) ||
    (!transmitting && !Config.enableRemoteClickOff)
  )
    return;

  UpdateHUD({ type: 'remoteClick', state: transmitting });
}

export async function LoadModule(): Promise<void> {
  UpdateHUD({ type: 'hud', enabled: true });

  setTick(() => {
    if (NetworkIsPlayerTalking(PlayerId()) && !IsVoiceActive) {
      IsVoiceActive = true;

      SendNuiMessage(JSON.stringify({ type: 'voiceStatus', speaking: true }));
    }

    if (!NetworkIsPlayerTalking(PlayerId()) && IsVoiceActive) {
      IsVoiceActive = false;

      SendNuiMessage(JSON.stringify({ type: 'voiceStatus', speaking: false }));
    }
  });
}
