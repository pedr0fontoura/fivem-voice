import { Debug, GetRandomString } from '../utils/utils';
import { PhoneCall } from '../types/misc';

const ActivePhoneCalls: Array<PhoneCall> = [];

export function StartPhoneCall(playerA: number, playerB: number): string {
  const callID = GetRandomString(9);

  ActivePhoneCalls.push({ callID: callID, playerA: playerA, playerB: playerB });

  TriggerClientEvent('naxel:player:phone:connect', playerA, playerB, callID);
  TriggerClientEvent('naxel:player:phone:connect', playerB, playerA, callID);

  Debug(`[Phone] Call Started | Call ID ${callID} | Player A ${playerA} | Player B ${playerB}`);

  return callID;
}

export function EndPhoneCall(callID: string): void {
  const callIndex = ActivePhoneCalls.findIndex(call => call.callID === callID);

  if (callIndex === -1) return;

  const callData = ActivePhoneCalls[callIndex];

  TriggerClientEvent('naxel:player:phone:disconnect', callData.playerA, callID);
  TriggerClientEvent('naxel:player:phone:disconnect', callData.playerB, callID);

  Debug(
    `[Phone] Call Ended | Call ID ${callID} | Player A ${callData.playerA} | Player B ${callData.playerB}`,
  );

  ActivePhoneCalls.splice(callIndex, 1);
}

export async function LoadModule(): Promise<void> {
  exports('StartPhoneCall', StartPhoneCall);

  exports('EndPhoneCall', EndPhoneCall);

  AddEventHandler('playerDropped', () => {
    const serverID = Number(source);

    const phoneCall = ActivePhoneCalls.find(
      call => call.playerA === serverID || call.playerB === serverID,
    );

    if (typeof phoneCall === 'undefined') return;

    EndPhoneCall(phoneCall.callID);
  });

  Debug(`[Phone] Module Loaded`);
}
