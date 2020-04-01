import { Config, Locales } from '../client';

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
    const activePlayers = GetActivePlayers();

    for (let i = 0; i < 30; i += 1) {
        MumbleClearVoiceTarget(i);
    }

    activePlayers.forEach(playerID => {
        MumbleSetVolumeOverride(playerID, -1.0);
    });

    MumbleSetVoiceTarget(1);

    NetworkSetTalkerProximity(6.0);

    NetworkSetVoiceChannel(GetPlayerServerId(GetPlayerIndex()));
}

export async function LoadAnimation(lib): Promise<void> {
    if (!HasAnimDictLoaded(lib)) {
        RequestAnimDict(lib);

        while (!HasAnimDictLoaded(lib)) {
            await Wait(10);
        }
    }
}
