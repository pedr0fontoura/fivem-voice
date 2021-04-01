import { debug, Wait, loadAnimation, _L } from '../utils';
import { Config, addPlayerToTargetList } from '../index';
import PlayerTargetList from '../classes/playerTargetList';

import { RadioChannel, RadioListener } from '../types/misc';

import * as HUD from './hud';

export const activeTargets = new PlayerTargetList();

const radioChannels: Array<RadioChannel> = [];

let currentChannel: RadioChannel, currentChannelId: number;

let [isRadioOn, isTalkingOnRadio, radioVolume] = [false, false, 1.0];

function SetRadioTargets(listeners: Map<number, RadioListener>): void {
  listeners.forEach(listener => {
    activeTargets.add(listener.playerID);

    addPlayerToTargetList(listener.playerID);
  });
}

async function SetTransmissionsVolume(
  listeners: Map<number, RadioListener>,
  volume: number,
): Promise<void> {
  listeners.forEach(async listener => {
    if (listener.transmitting) MumbleSetVolumeOverride(listener.playerID, volume);
  });
}

function SetRadioVolume(volume: number): void {
  if (volume <= 0) return;

  radioVolume = volume > 10 ? 1.0 : volume * 0.1;

  radioChannels.forEach(async channel => {
    SetTransmissionsVolume(channel.listeners, radioVolume);
  });

  debug(`Volume Changed | Previous '${volume}' | New ${volume}`);
}

async function PlayRadioAnimation(): Promise<void> {
  const playerPed = GetPlayerPed(-1);
  const lib = 'random@arrests';
  const anim = 'generic_radio_chatter';

  loadAnimation(lib);

  while (isTalkingOnRadio) {
    if (!IsEntityPlayingAnim(playerPed, lib, anim, 3)) {
      TaskPlayAnim(playerPed, lib, anim, 8.0, 0.0, -1, 49, 0, false, false, false);
    }

    await Wait(10);
  }

  StopAnimTask(playerPed, lib, anim, 3);
}

function ToggleRadioTransmission(): void {
  if (!isRadioOn && !isTalkingOnRadio) return;

  isTalkingOnRadio = !isTalkingOnRadio;

  if (isTalkingOnRadio) {
    SetRadioTargets(currentChannel.listeners);

    PlayRadioAnimation();
  } else {
    activeTargets.wipe();
  }

  TriggerServerEvent('naxel:player:radio:transmission', currentChannel.radioID, isTalkingOnRadio);

  HUD.updateRadioTransmitting(isTalkingOnRadio);

  debug(
    `[Radio] Casting: '${isTalkingOnRadio}' | Radio '${currentChannel.radioID}' | Channel '${currentChannelId}'`,
  );
}

function SetRadioPowerState(state: boolean): void {
  isRadioOn = state;

  const volume = isRadioOn ? radioVolume : -1.0;

  radioChannels.forEach(async channel => {
    SetTransmissionsVolume(channel.listeners, volume);
  });

  if (!isRadioOn && isTalkingOnRadio) ToggleRadioTransmission();

  HUD.updateRadioPowerState(isRadioOn);

  debug(`[Radio] Power State: ${state}`);
}

function SetRadioChannel(channelID: number): void {
  currentChannel = radioChannels[channelID];
  currentChannelId = channelID;

  HUD.updateRadioFrequency(currentChannel);

  debug(
    `[Radio] Channel Changed | Channel '${currentChannelId}'| Frequency '${currentChannel.radioID}'`,
  );
}

function CycleRadioChannels(): void {
  if (isTalkingOnRadio) ToggleRadioTransmission();

  if (!isRadioOn) return;

  const channels = radioChannels.length;

  if (channels > 0) {
    if (currentChannel === null) {
      SetRadioChannel(0);
    } else {
      const nextChannel = currentChannelId + 1;

      typeof radioChannels[nextChannel] !== 'undefined'
        ? SetRadioChannel(nextChannel)
        : SetRadioChannel(0);
    }
  } else {
    SetRadioPowerState(false);
  }
}

function ConnectToRadio(radioID: string, listeners: Array<RadioListener>): void {
  if (isTalkingOnRadio) ToggleRadioTransmission();

  const channelData: RadioChannel = {
    radioID: radioID,
    listeners: new Map<number, RadioListener>(),
  };

  listeners.forEach(listener => {
    listener.playerID = GetPlayerFromServerId(listener.serverID);

    channelData.listeners.set(listener.serverID, listener);

    if (isRadioOn && listener.transmitting) {
      MumbleSetVolumeOverride(listener.playerID, radioVolume);
    }
  });

  const channels = radioChannels.push(channelData);

  SetRadioChannel(channels - 1);

  debug(`[Radio] Connected | Frequency '${radioID}'`);
}

function DisconnectFromRadio(radioID: string): void {
  const channelID = radioChannels.findIndex(channel => channel.radioID === radioID);

  if (channelID === -1) return;

  const channel = radioChannels[channelID];

  SetTransmissionsVolume(channel.listeners, -1.0);

  radioChannels.splice(channelID, 1);

  if (currentChannel.radioID === radioID) {
    CycleRadioChannels();
  }

  debug(`[Radio] Disconnected | Frequency '${radioID}'`);
}

function AddRadioListener(radioID: string, serverID: number): void {
  const channel = radioChannels.find(channel => channel.radioID === radioID);

  if (typeof channel === 'undefined') return;

  const playerID = GetPlayerFromServerId(serverID);

  channel.listeners.set(serverID, { playerID, serverID, transmitting: false });

  if (isTalkingOnRadio) {
    addPlayerToTargetList(playerID);
  }

  debug(`[Radio] Listener Added | Frequency '${radioID}' | Player '${serverID}`);
}

function RemoveRadioListener(radioID: string, serverID: number): void {
  const channel = radioChannels.find(channel => channel.radioID === radioID);

  if (typeof channel === 'undefined') return;

  const listener = channel.listeners.get(serverID);

  if (typeof listener === 'undefined') return;

  MumbleSetVolumeOverride(listener.playerID, -1.0);

  channel.listeners.delete(serverID);

  if (isTalkingOnRadio && currentChannel.radioID === radioID) {
    SetRadioTargets(currentChannel.listeners);
  }

  debug(`[Radio] Listener Removed | Frequency '${radioID}' | Player '${serverID}`);
}

function ReceiveRadioTransmission(radioID: string, serverID: number, transmitting: boolean): void {
  const channel = radioChannels.find(channel => channel.radioID === radioID);

  if (typeof channel === 'undefined') return;

  const listener = channel.listeners.get(serverID);

  if (typeof listener === 'undefined') return;

  listener.transmitting = transmitting;

  if (isRadioOn) {
    const volume = transmitting ? radioVolume : -1.0;

    MumbleSetVolumeOverride(listener.playerID, volume);

    HUD.playRemoteRadioClick(transmitting);
  }

  debug(`[Radio] Listening: ${transmitting} | Frequency '${radioID}' | Player '${serverID}`);
}

export async function LoadModule(): Promise<void> {
  addNetEventListener('naxel:player:radio:power', SetRadioPowerState.bind(this));
  addNetEventListener('naxel:player:radio:volume', SetRadioVolume.bind(this));
  addNetEventListener('naxel:player:radio:connect', ConnectToRadio.bind(this));
  addNetEventListener('naxel:player:radio:disconnect', DisconnectFromRadio.bind(this));
  addNetEventListener('naxel:player:radio:added', AddRadioListener.bind(this));
  addNetEventListener('naxel:player:radio:removed', RemoveRadioListener.bind(this));
  addNetEventListener('naxel:player:radio:listen', ReceiveRadioTransmission.bind(this));

  RegisterKeyMapping('+speakToRadio', _L('speakToRadio'), 'keyboard', Config.toggleRadioHotkey);
  RegisterCommand('+speakToRadio', ToggleRadioTransmission.bind(this), false);
  RegisterCommand('-speakToRadio', ToggleRadioTransmission.bind(this), false);

  RegisterKeyMapping(
    '+switchRadioChannel',
    _L('cycleRadioFrequencies'),
    'keyboard',
    Config.cycleFrequencyHotkey,
  );
  RegisterCommand('+switchRadioChannel', CycleRadioChannels.bind(this), false);
  RegisterCommand('-switchRadioChannel', () => {}, false);

  exports('SetRadioVolume', SetRadioVolume);
  exports('SetRadioPowerState', SetRadioPowerState);

  setTick(async () => {
    if (isTalkingOnRadio) {
      SetControlNormal(0, 249, 1.0);
    }
  });

  debug(`[Radio] Module Loaded`);
}
