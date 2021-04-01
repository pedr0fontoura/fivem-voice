import { addPlayerToTargetList, removePlayerFromTargetList } from '../index';

import { PhoneCall } from '../types/misc';

import { debug } from '../utils';

export let isOnPhoneCall: boolean;

let currentCall: PhoneCall;

function StartPhoneCall(serverId: number, callId: string): void {
  if (isOnPhoneCall) return;

  isOnPhoneCall = true;

  currentCall = {
    callId: callId,
    serverId: serverId,
  };

  addPlayerToTargetList(serverId);

  MumbleSetVolumeOverrideByServerId(serverId, 1.0);

  debug(`[Phone] Call Started | Call ID ${callId} | Player ${serverId}`);
}

function EndPhoneCall(callId: string): void {
  if (!isOnPhoneCall || callId !== currentCall.callId) return;

  MumbleSetVolumeOverrideByServerId(currentCall.serverId, -1.0);

  removePlayerFromTargetList(currentCall.serverId);

  debug(`[Phone] Call Ended | Call ID ${callId} | Player ${currentCall.serverId}`);

  currentCall = null;

  isOnPhoneCall = false;
}

export async function LoadModule(): Promise<void> {
  addNetEventListener('naxel:player:phone:connect', StartPhoneCall.bind(this));
  addNetEventListener('naxel:player:phone:disconnect', EndPhoneCall.bind(this));

  debug(`[Phone] Module Loaded`);
}
