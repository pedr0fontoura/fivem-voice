import { Config, Locales } from '../index';

export function Delay(time: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, time));
}

export function _L(str: string): string {
  if (!Locales) return `Locale '${Config.locale}' not found`;

  return Locales[str] ? Locales[str] : `Translation for '${str}' not found`;
}

export const debug = {
  log: (str: string) => {
    if (Config.debugMode >= 1) {
      console.log(str);
    }
  },
  verbose: (str: string) => {
    if (Config.debugMode >= 2) {
      console.log(str);
    }
  },
};

export function resetVoice(): void {
  for (let i = 0; i < 30; i++) {
    MumbleClearVoiceTarget(i);
  }

  MumbleSetAudioInputDistance(Config.voiceRanges[1].distance);

  MumbleSetVoiceTarget(1);
}

export async function loadAnimation(dict: string): Promise<void> {
  if (!HasAnimDictLoaded(dict)) {
    RequestAnimDict(dict);

    while (!HasAnimDictLoaded(dict)) {
      await Delay(10);
    }
  }
}
