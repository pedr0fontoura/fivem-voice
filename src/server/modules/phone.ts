import { debug, getRandomString } from '../utils/utils';
import { PhoneCall } from '../types/misc';

const exp = (<any>global).exports;

const ActivePhoneCalls: Array<PhoneCall> = [];

export function startPhoneCall(playerA: number, playerB: number): string {
  const callId = getRandomString(9);

  ActivePhoneCalls.push({ callId, playerA, playerB });

  TriggerClientEvent('naxel:player:phone:connect', playerA, playerB, callId);
  TriggerClientEvent('naxel:player:phone:connect', playerB, playerA, callId);

  debug(`[Phone] Call Started | Call ID ${callId} | Player A ${playerA} | Player B ${playerB}`);

  return callId;
}

export function endPhoneCall(callId: string): void {
  const callIndex = ActivePhoneCalls.findIndex(call => call.callId === callId);

  if (callIndex === -1) return;

  const callData = ActivePhoneCalls[callIndex];

  TriggerClientEvent('naxel:player:phone:disconnect', callData.playerA, callId);
  TriggerClientEvent('naxel:player:phone:disconnect', callData.playerB, callId);

  debug(
    `[Phone] Call Ended | Call ID ${callId} | Player A ${callData.playerA} | Player B ${callData.playerB}`,
  );

  ActivePhoneCalls.splice(callIndex, 1);
}

export async function loadModule(): Promise<void> {
  exp('startPhoneCall', startPhoneCall);

  exp('endPhoneCall', endPhoneCall);

  AddEventHandler('playerDropped', () => {
    const serverID = Number(source);

    const phoneCall = ActivePhoneCalls.find(
      call => call.playerA === serverID || call.playerB === serverID,
    );

    if (!phoneCall) return;

    endPhoneCall(phoneCall.callId);
  });

  debug(`[Phone] Module Loaded`);
}
