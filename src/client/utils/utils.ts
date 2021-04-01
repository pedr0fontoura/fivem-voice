import { Config, Locales } from '../index';

const ResourceName = GetCurrentResourceName();

export function Wait(time: number): Promise<void> {
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

export async function Debug(str: string): Promise<void> {
  if (!Config.enableDebugMode) return;

  console.log(`[${ResourceName}] ${str}`);
}

export function ResetVoice(): void {
  for (let i = 0; i < 30; i++) {
    MumbleClearVoiceTarget(i);
  }

  MumbleSetVoiceTarget(1);
}

export async function LoadAnimation(lib): Promise<void> {
  if (!HasAnimDictLoaded(lib)) {
    RequestAnimDict(lib);

    while (!HasAnimDictLoaded(lib)) {
      await Wait(10);
    }
  }
}
