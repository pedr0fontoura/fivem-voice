import { addPlayerToTargetList, Config, removePlayerFromTargetList } from '../index';

import { PhoneCall } from '../types/misc';

import * as Submix from './submix';

import { debug } from '../utils';

export let isOnPhoneCall: boolean;

export let currentCall: PhoneCall;

function startPhoneCall(serverId: number, callId: string): void {
  if (isOnPhoneCall) return;

  isOnPhoneCall = true;

  currentCall = {
    callId: callId,
    serverId: serverId,
  };

  addPlayerToTargetList(serverId);

  MumbleSetVolumeOverrideByServerId(serverId, 1.0);

  if (Config.enableSubmixModule) {
    Submix.applyRadioSubmix(serverId);
  }

  debug.log(`[Phone] Call Started | Call ID ${callId} | Player ${serverId}`);
}

function endPhoneCall(callId: string): void {
  if (!isOnPhoneCall || callId !== currentCall.callId) return;

  MumbleSetVolumeOverrideByServerId(currentCall.serverId, -1.0);

  if (Config.enableSubmixModule) {
    Submix.reset(currentCall.serverId);
  }

  removePlayerFromTargetList(currentCall.serverId);

  debug.log(`[Phone] Call Ended | Call ID ${callId} | Player ${currentCall.serverId}`);

  currentCall = null;

  isOnPhoneCall = false;
}

export async function loadModule(): Promise<void> {
  addNetEventListener('voice:player:phone:connect', startPhoneCall.bind(this));
  addNetEventListener('voice:player:phone:disconnect', endPhoneCall.bind(this));

  debug.log(`[Phone] Module Loaded`);
}
