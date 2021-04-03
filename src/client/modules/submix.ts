/* 
  Thanks to AvarianKnight for the default submix info

  freq_low = 389.0
  freq_hi = 3248.0
  fudge = 0.0
  rm_mod_freq = 0.0
  rm_mix = 0.16
  o_freq_lo = 348.0
  0_freq_hi = 4900.0

*/

import { debug } from '../utils';

const radioEffectId = CreateAudioSubmix('Radio');
SetAudioSubmixEffectRadioFx(radioEffectId, 0);
SetAudioSubmixEffectParamInt(radioEffectId, 0, GetHashKey('default'), 1);
AddAudioSubmixOutput(radioEffectId, 0);

const phoneEffectId = CreateAudioSubmix('Phone');
SetAudioSubmixEffectRadioFx(phoneEffectId, 1);
SetAudioSubmixEffectParamInt(phoneEffectId, 1, GetHashKey('default'), 1);
SetAudioSubmixEffectParamFloat(phoneEffectId, 1, GetHashKey('freq_low'), 700.0);
SetAudioSubmixEffectParamFloat(phoneEffectId, 1, GetHashKey('freq_hi'), 15000.0);
AddAudioSubmixOutput(phoneEffectId, 1);

export function applyRadioSubmix(serverId: number) {
  debug.verbose(
    `[Submix] Applying Radio submix | Submix ID: ${radioEffectId} | Server ID: ${serverId}`,
  );
  MumbleSetSubmixForServerId(serverId, radioEffectId);
}

export function applyPhoneSubmix(serverId: number) {
  debug.verbose(
    `[Submix] Applying Phone submix | Submix ID: ${phoneEffectId} | Server ID: ${serverId}`,
  );
  MumbleSetSubmixForServerId(serverId, phoneEffectId);
}

export function reset(serverId: number) {
  debug.verbose(`[Submix] Reset submix for player | Server ID: ${serverId}`);
  MumbleSetSubmixForServerId(serverId, -1);
}
