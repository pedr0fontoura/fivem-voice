import { Config } from '../index';
import { RadioChannel } from '../types/misc';

let isVoiceActive = false;

export async function updateHUD(payload): Promise<void> {
  if (!Config.enableNUIModule) return;

  SendNuiMessage(JSON.stringify(payload));
}

export function updateHUDProximity(range: string): void {
  updateHUD({ type: 'proximity', proximity: range });
}

export function updateRadioPowerState(state: boolean): void {
  updateHUD({ type: 'radioPowerState', state: state });
}

export function updateRadioTransmitting(transmitting: boolean): void {
  updateHUD({ type: 'radioTransmission', status: transmitting });
}

export function updateRadioFrequency(channelData: RadioChannel): void {
  updateHUD({ type: 'frequency', frequency: channelData.radioId });
}

export function playRemoteRadioClick(transmitting): void {
  if (
    (transmitting && !Config.enableRemoteClickOn) ||
    (!transmitting && !Config.enableRemoteClickOff)
  )
    return;

  updateHUD({ type: 'remoteClick', state: transmitting });
}

export async function loadModule(): Promise<void> {
  updateHUD({ type: 'hud', enabled: true });

  setTick(() => {
    if (NetworkIsPlayerTalking(PlayerId()) && !isVoiceActive) {
      isVoiceActive = true;

      SendNuiMessage(JSON.stringify({ type: 'voiceStatus', speaking: true }));
    }

    if (!NetworkIsPlayerTalking(PlayerId()) && isVoiceActive) {
      isVoiceActive = false;

      SendNuiMessage(JSON.stringify({ type: 'voiceStatus', speaking: false }));
    }
  });
}
