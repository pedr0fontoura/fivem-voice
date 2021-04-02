import { Config, Locales } from '../index';

export function Delay(time: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, time));
}

export function _L(str: string): string {
  if (Locales === null) return `Locale '${Config.locale}' not Found`;

  if (typeof Locales[str] !== 'undefined') {
    return Locales[str];
  } else {
    return `Translation for '${str}' not Found`;
  }
}

export async function debug(str: string): Promise<void> {
  if (!Config.enableDebugMode) return;

  console.log(str);
}

export function resetVoice(): void {
  for (let i = 0; i < 30; i++) {
    MumbleClearVoiceTarget(i);
  }

  MumbleSetAudioInputDistance(Config.voiceRanges[1].distance);
  MumbleSetAudioOutputDistance(Config.voiceRanges[1].distance);

  MumbleSetVoiceTarget(1);
}

export async function loadAnimation(lib): Promise<void> {
  if (!HasAnimDictLoaded(lib)) {
    RequestAnimDict(lib);

    while (!HasAnimDictLoaded(lib)) {
      await Delay(10);
    }
  }
}
