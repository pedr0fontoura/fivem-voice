import { Debug, Wait, LoadAnimation, _L } from '../utils/utils';
import { Config, AddPlayerToTargetList } from '../client';
import { TargetList } from '../classes/targetlist';

import { RadioChannel, RadioListener } from '../types/misc';

import * as HUD from './hud';

export const ActiveTargets: TargetList = new TargetList();

const RadioChannels: Array<RadioChannel> = [];

let CurrentChannel: RadioChannel, CurrentChannelID: number;

let [IsRadioOn, IsTalkingOnRadio, RadioVolume] = [false, false, 1.0];

function SetRadioTargets(listeners: Map<number, RadioListener>): void {
    listeners.forEach(listener => {
        ActiveTargets.add(listener.playerID);

        AddPlayerToTargetList(listener.playerID);
    });
}

async function SetTransmissionsVolume(listeners: Map<number, RadioListener>, volume: number): Promise<void> {
    listeners.forEach(async listener => {
        if (listener.transmitting) MumbleSetVolumeOverride(listener.playerID, volume);
    });
}

function SetRadioVolume(volume: number): void {
    if (volume <= 0) return;

    RadioVolume = volume > 10 ? 1.0 : volume * 0.1;

    RadioChannels.forEach(async channel => {
        SetTransmissionsVolume(channel.listeners, RadioVolume);
    });

    Debug(`Volume Changed | Previous '${volume}' | New ${volume}`);
}

async function PlayRadioAnimation(): Promise<void> {
    const playerPed = GetPlayerPed(-1);
    const lib = 'random@arrests';
    const anim = 'generic_radio_chatter';

    LoadAnimation(lib);

    while (IsTalkingOnRadio) {
        if (!IsEntityPlayingAnim(playerPed, lib, anim, 3)) {
            TaskPlayAnim(playerPed, lib, anim, 8.0, 0.0, -1, 49, 0, false, false, false);
        }

        await Wait(10);
    }

    StopAnimTask(playerPed, lib, anim, 3);
}

function ToggleRadioTransmission(): void {
    if (!IsRadioOn && !IsTalkingOnRadio) return;

    IsTalkingOnRadio = !IsTalkingOnRadio;

    if (IsTalkingOnRadio) {
        SetRadioTargets(CurrentChannel.listeners);

        PlayRadioAnimation();
    } else {
        ActiveTargets.wipe();
    }

    TriggerServerEvent('naxel:player:radio:transmission', CurrentChannel.radioID, IsTalkingOnRadio);

    HUD.UpdateRadioTransmitting(IsTalkingOnRadio);

    Debug(`[Radio] Casting: '${IsTalkingOnRadio}' | Radio '${CurrentChannel.radioID}' | Channel '${CurrentChannelID}'`);
}

function SetRadioPowerState(state: boolean): void {
    IsRadioOn = state;

    const volume = IsRadioOn ? RadioVolume : -1.0;

    RadioChannels.forEach(async channel => {
        SetTransmissionsVolume(channel.listeners, volume);
    });

    if (!IsRadioOn && IsTalkingOnRadio) ToggleRadioTransmission();

    HUD.UpdateRadioPowerState(IsRadioOn);

    Debug(`[Radio] Power State: ${state}`);
}

function SetRadioChannel(channelID: number): void {
    CurrentChannel = RadioChannels[channelID];
    CurrentChannelID = channelID;

    HUD.UpdateRadioFrequency(CurrentChannel);

    Debug(`[Radio] Channel Changed | Channel '${CurrentChannelID}'| Frequency '${CurrentChannel.radioID}'`);
}

function CycleRadioChannels(): void {
    if (IsTalkingOnRadio) ToggleRadioTransmission();

    if (!IsRadioOn) return;

    const channels = RadioChannels.length;

    if (channels > 0) {
        if (CurrentChannel === null) {
            SetRadioChannel(0);
        } else {
            const nextChannel = CurrentChannelID + 1;

            typeof RadioChannels[CurrentChannelID] !== 'undefined' ? SetRadioChannel(nextChannel) : SetRadioChannel(0);
        }
    } else {
        SetRadioPowerState(false);
    }
}

function ConnectToRadio(radioID: string, listeners: Array<RadioListener>): void {
    if (IsTalkingOnRadio) ToggleRadioTransmission();

    const channelData: RadioChannel = {
        radioID: radioID,
        listeners: new Map<number, RadioListener>(),
    };

    listeners.forEach(listener => {
        listener.playerID = GetPlayerFromServerId(listener.serverID);

        channelData.listeners.set(listener.serverID, listener);

        if (IsRadioOn && listener.transmitting) {
            MumbleSetVolumeOverride(listener.playerID, RadioVolume);
        }
    });

    const channels = RadioChannels.push(channelData);

    SetRadioChannel(channels - 1);

    Debug(`[Radio] Connected | Frequency '${radioID}'`);
}

function DisconnectFromRadio(radioID: string): void {
    const channelID = RadioChannels.findIndex(channel => channel.radioID === radioID);

    if (channelID === -1) return;

    const channel = RadioChannels[channelID];

    SetTransmissionsVolume(channel.listeners, -1.0);

    RadioChannels.splice(channelID, 1);

    if (CurrentChannel.radioID === radioID) {
        CycleRadioChannels();
    }

    Debug(`[Radio] Disconnected | Frequency '${radioID}'`);
}

function AddRadioListener(radioID: string, serverID: number): void {
    const channel = RadioChannels.find(channel => channel.radioID === radioID);

    if (typeof channel === 'undefined') return;

    const playerID = GetPlayerFromServerId(serverID);

    channel.listeners.set(serverID, { playerID, serverID, transmitting: false });

    if (IsTalkingOnRadio) {
        AddPlayerToTargetList(playerID);
    }

    Debug(`[Radio] Listener Added | Frequency '${radioID}' | Player '${serverID}`);
}

function RemoveRadioListener(radioID: string, serverID: number): void {
    const channel = RadioChannels.find(channel => channel.radioID === radioID);

    if (typeof channel === 'undefined') return;

    const listener = channel.listeners.get(serverID);

    if (typeof listener === 'undefined') return;

    MumbleSetVolumeOverride(listener.playerID, -1.0);

    channel.listeners.delete(serverID);

    if (IsTalkingOnRadio && CurrentChannel.radioID === radioID) {
        SetRadioTargets(CurrentChannel.listeners);
    }

    Debug(`[Radio] Listener Removed | Frequency '${radioID}' | Player '${serverID}`);
}

function ReceiveRadioTransmission(radioID: string, serverID: number, transmitting: boolean): void {
    const channel = RadioChannels.find(channel => channel.radioID === radioID);

    if (typeof channel === 'undefined') return;

    const listener = channel.listeners.get(serverID);

    if (typeof listener === 'undefined') return;

    listener.transmitting = transmitting;

    if (IsRadioOn) {
        const volume = transmitting ? RadioVolume : -1.0;

        MumbleSetVolumeOverride(listener.playerID, volume);

        HUD.PlayRemoteRadioClick(transmitting);
    }

    Debug(`[Radio] Listening: ${transmitting} | Frequency '${radioID}' | Player '${serverID}`);
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

    RegisterKeyMapping('+switchRadioChannel', _L('cycleRadioFrequencies'), 'keyboard', Config.cycleFrequencyHotkey);
    RegisterCommand('+switchRadioChannel', CycleRadioChannels.bind(this), false);
    RegisterCommand('-switchRadioChannel', () => {}, false);

    exports('SetRadioVolume', SetRadioVolume);
    exports('SetRadioPowerState', SetRadioPowerState);

    setTick(async () => {
        if (IsTalkingOnRadio) {
            SetControlNormal(0, 249, 1.0);
        }
    });

    Debug(`[Radio] Module Loaded`);
}
