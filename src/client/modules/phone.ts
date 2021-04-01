import { AddPlayerToTargetList, RemovePlayerFromTargetList } from '../index';

import { PhoneCall } from '../types/misc';

import { Debug } from '../utils/utils';

export let IsOnPhoneCall: boolean;

let CurrentCall: PhoneCall;

function StartPhoneCall(serverID: number, callID: string): void {
  if (IsOnPhoneCall) return;

  IsOnPhoneCall = true;

  const playerID = GetPlayerFromServerId(serverID);

  CurrentCall = {
    callID: callID,
    serverID: serverID,
    playerID: playerID,
  };

  AddPlayerToTargetList(serverID);

  MumbleSetVolumeOverrideByServerId(serverID, 1.0);

  Debug(`[Phone] Call Started | Call ID ${callID} | Player ${serverID}`);
}

function EndPhoneCall(callID: string): void {
  if (!IsOnPhoneCall || callID !== CurrentCall.callID) return;

  MumbleSetVolumeOverrideByServerId(CurrentCall.serverID, -1.0);

  RemovePlayerFromTargetList(CurrentCall.serverID);

  Debug(`[Phone] Call Ended | Call ID ${callID} | Player ${CurrentCall.serverID}`);

  CurrentCall = null;

  IsOnPhoneCall = false;
}

export async function LoadModule(): Promise<void> {
  addNetEventListener('naxel:player:phone:connect', StartPhoneCall.bind(this));
  addNetEventListener('naxel:player:phone:disconnect', EndPhoneCall.bind(this));

  Debug(`[Phone] Module Loaded`);
}
