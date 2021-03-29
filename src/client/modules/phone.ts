import { AddPlayerToTargetList } from '../index';
import { TargetList } from '../classes/targetlist';

import { PhoneCall } from '../types/misc';

import { Debug } from '../utils/utils';

export let IsOnPhoneCall;

export const ActiveTargets: TargetList = new TargetList();

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

  ActiveTargets.add(playerID);

  AddPlayerToTargetList(playerID);

  MumbleSetVolumeOverride(playerID, 1.0);

  Debug(`[Phone] Call Started | Call ID ${callID} | Player ${serverID}`);
}

function EndPhoneCall(callID: string): void {
  if (!IsOnPhoneCall || callID !== CurrentCall.callID) return;

  MumbleSetVolumeOverride(CurrentCall.playerID, -1.0);

  ActiveTargets.remove(CurrentCall.playerID);

  Debug(`[Phone] Call Ended | Call ID ${callID} | Player ${CurrentCall.serverID}`);

  CurrentCall = null;

  IsOnPhoneCall = false;
}

export async function LoadModule(): Promise<void> {
  addNetEventListener('naxel:player:phone:connect', StartPhoneCall.bind(this));
  addNetEventListener('naxel:player:phone:disconnect', EndPhoneCall.bind(this));

  Debug(`[Phone] Module Loaded`);
}
