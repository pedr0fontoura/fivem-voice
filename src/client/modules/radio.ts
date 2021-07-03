import { debug, loadAnimation, _L } from '../utils';
import { Config, addPlayerToTargetList, removePlayerFromTargetList } from '../index';

import { RadioChannel, RadioListener } from '../types/misc';

import * as Phone from './phone';
import * as Submix from './submix';
import * as HUD from './hud';

const ANIM = {
  DICT: 'random@arrests',
  NAME: 'generic_radio_chatter',
};

const playerServerId = GetPlayerServerId(PlayerId());

const radioChannels: Array<RadioChannel> = [];

let currentChannel: RadioChannel, currentChannelId: number;

let [isRadioOn, isTalkingOnRadio, radioVolume] = [false, false, 1.0];

function setRadioTargets(listeners: Map<number, RadioListener>): void {
  listeners.forEach(listener => {
    if (listener.serverId !== playerServerId) {
      addPlayerToTargetList(listener.serverId);
    }
  });
}

function resetRadioTargets(listeners: Map<number, RadioListener>): void {
  listeners.forEach(listener => {
    if (
      Config.enablePhoneModule &&
      Phone.isOnPhoneCall &&
      Phone.currentCall.serverId === listener.serverId
    ) {
      return;
    }

    removePlayerFromTargetList(listener.serverId);
  });
}

async function setTransmissionsVolume(
  listeners: Map<number, RadioListener>,
  volume: number,
): Promise<void> {
  listeners.forEach(async listener => {
    if (listener.transmitting) MumbleSetVolumeOverrideByServerId(listener.serverId, volume);
  });
}

function setRadioVolume(volume: number): void {
  if (volume <= 0) return;

  radioVolume = volume > 10 ? 1.0 : volume * 0.1;

  radioChannels.forEach(async channel => {
    setTransmissionsVolume(channel.listeners, radioVolume);
  });

  debug.verbose(`Volume Changed | Previous '${volume}' | New ${volume}`);
}

async function playRadioAnimation(): Promise<void> {
  const playerPed = PlayerPedId();

  loadAnimation(ANIM.DICT);

  TaskPlayAnim(playerPed, ANIM.DICT, ANIM.NAME, 8.0, 0.0, -1, 49, 0, false, false, false);

  const animInterval = setInterval(() => {
    if (isTalkingOnRadio) {
      if (!IsEntityPlayingAnim(playerPed, ANIM.DICT, ANIM.NAME, 3)) {
        TaskPlayAnim(playerPed, ANIM.DICT, ANIM.NAME, 8.0, 0.0, -1, 49, 0, false, false, false);
      }
    } else {
      clearInterval(animInterval);
      StopAnimTask(playerPed, ANIM.DICT, ANIM.NAME, 3);
    }
  }, 500);
}

function toggleRadioTransmission(): void {
  if (!isRadioOn && !isTalkingOnRadio) return;

  isTalkingOnRadio = !isTalkingOnRadio;

  if (isTalkingOnRadio) {
    setRadioTargets(currentChannel.listeners);

    playRadioAnimation();
  } else {
    resetRadioTargets(currentChannel.listeners);
  }

  TriggerServerEvent('voice:player:radio:transmission', currentChannel.radioId, isTalkingOnRadio);

  HUD.updateRadioTransmitting(isTalkingOnRadio);

  debug.verbose(
    `[Radio] Casting: '${isTalkingOnRadio}' | Radio '${currentChannel.radioId}' | Channel '${currentChannelId}'`,
  );
}

function setRadioPowerState(state: boolean): void {
  isRadioOn = state;

  const volume = isRadioOn ? radioVolume : -1.0;

  radioChannels.forEach(async channel => {
    setTransmissionsVolume(channel.listeners, volume);
  });

  if (!isRadioOn && isTalkingOnRadio) toggleRadioTransmission();

  HUD.updateRadioPowerState(isRadioOn);

  debug.log(`[Radio] Power State: ${state}`);
}

function setRadioChannel(channelId: number): void {
  currentChannel = radioChannels[channelId];
  currentChannelId = channelId;

  HUD.updateRadioFrequency(currentChannel);

  debug.verbose(
    `[Radio] Channel Changed | Channel '${currentChannelId}'| Frequency '${currentChannel.radioId}'`,
  );
}

function cycleRadioChannels(): void {
  if (isTalkingOnRadio) toggleRadioTransmission();

  if (!isRadioOn) return;

  const channels = radioChannels.length;

  if (channels > 0) {
    if (currentChannel === null) {
      setRadioChannel(0);
    } else {
      const nextChannel = currentChannelId + 1;

      radioChannels[nextChannel] ? setRadioChannel(nextChannel) : setRadioChannel(0);
    }
  } else {
    setRadioPowerState(false);
  }
}

function connectToRadio(radioId: string, listeners: Array<RadioListener>): void {
  if (isTalkingOnRadio) toggleRadioTransmission();

  const channelData: RadioChannel = {
    radioId: radioId,
    listeners: new Map<number, RadioListener>(),
  };

  listeners.forEach(listener => {
    channelData.listeners.set(listener.serverId, listener);

    if (isRadioOn && listener.transmitting) {
      MumbleSetVolumeOverrideByServerId(listener.serverId, radioVolume);
    }
  });

  const channels = radioChannels.push(channelData);

  setRadioChannel(channels - 1);

  debug.log(`[Radio] Connected | Frequency '${radioId}'`);
}

function disconnectFromRadio(radioId: string): void {
  const channelId = radioChannels.findIndex(channel => channel.radioId === radioId);

  if (channelId === -1) return;

  const channel = radioChannels[channelId];

  setTransmissionsVolume(channel.listeners, -1.0);

  radioChannels.splice(channelId, 1);

  if (currentChannel.radioId === radioId) {
    cycleRadioChannels();
  }

  debug.log(`[Radio] Disconnected | Frequency '${radioId}'`);
}

function addRadioListener(radioId: string, serverId: number): void {
  const channel = radioChannels.find(channel => channel.radioId === radioId);

  if (!channel) return;

  channel.listeners.set(serverId, { serverId, transmitting: false });

  if (isTalkingOnRadio) {
    addPlayerToTargetList(serverId);
  }

  debug.verbose(`[Radio] Listener Added | Frequency '${radioId}' | Player '${serverId}`);
}

function removeRadioListener(radioId: string, serverId: number): void {
  const channel = radioChannels.find(channel => channel.radioId === radioId);

  if (!channel) return;

  const listener = channel.listeners.get(serverId);

  if (!listener) return;

  MumbleSetVolumeOverrideByServerId(listener.serverId, -1.0);

  channel.listeners.delete(serverId);

  if (isTalkingOnRadio && currentChannel.radioId === radioId) {
    setRadioTargets(currentChannel.listeners);
  }

  debug.verbose(`[Radio] Listener Removed | Frequency '${radioId}' | Player '${serverId}`);
}

function receiveRadioTransmission(radioId: string, serverId: number, transmitting: boolean): void {
  const channel = radioChannels.find(channel => channel.radioId === radioId);

  if (!channel) return;

  const listener = channel.listeners.get(serverId);

  if (!listener) return;

  listener.transmitting = transmitting;

  if (Config.enablePhoneModule && Phone.isOnPhoneCall && Phone.currentCall.serverId === serverId) {
    return;
  }

  if (isRadioOn) {
    const volume = transmitting ? radioVolume : -1.0;

    MumbleSetVolumeOverrideByServerId(listener.serverId, volume);

    if (Config.enableSubmixModule) {
      if (transmitting) {
        Submix.applyRadioSubmix(listener.serverId);
      } else {
        Submix.reset(listener.serverId);
      }
    }

    HUD.playRemoteRadioClick(transmitting);
  }

  debug.verbose(
    `[Radio] Listening: ${transmitting} | Frequency '${radioId}' | Player '${serverId}`,
  );
}

export async function loadModule(): Promise<void> {
  addNetEventListener('voice:player:radio:power', setRadioPowerState.bind(this));
  addNetEventListener('voice:player:radio:volume', setRadioVolume.bind(this));
  addNetEventListener('voice:player:radio:connect', connectToRadio.bind(this));
  addNetEventListener('voice:player:radio:disconnect', disconnectFromRadio.bind(this));
  addNetEventListener('voice:player:radio:added', addRadioListener.bind(this));
  addNetEventListener('voice:player:radio:removed', removeRadioListener.bind(this));
  addNetEventListener('voice:player:radio:listen', receiveRadioTransmission.bind(this));

  RegisterKeyMapping('+speakToRadio', _L('speakToRadio'), 'keyboard', Config.toggleRadioHotkey);
  RegisterCommand('+speakToRadio', toggleRadioTransmission.bind(this), false);
  RegisterCommand('-speakToRadio', toggleRadioTransmission.bind(this), false);

  RegisterKeyMapping(
    '+switchRadioChannel',
    _L('cycleRadioFrequencies'),
    'keyboard',
    Config.cycleFrequencyHotkey,
  );
  RegisterCommand('+switchRadioChannel', cycleRadioChannels.bind(this), false);
  RegisterCommand('-switchRadioChannel', () => {}, false);

  exports('setRadioVolume', setRadioVolume);
  exports('setRadioPowerState', setRadioPowerState);

  setTick(() => {
    if (isTalkingOnRadio) {
      SetControlNormal(0, 249, 1.0);
    }
  });

  debug.log(`[Radio] Module Loaded`);
}
