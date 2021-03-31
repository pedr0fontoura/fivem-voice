import { RostConfig } from './types/misc';

// Import Classes
import { TargetList } from './classes/targetlist';

// Import Modules
import * as Radio from './modules/radio';
import * as Phone from './modules/phone';
import * as HUD from './modules/hud';

// Import Utils
import { _L, Debug, Wait, ResetVoice } from './utils/utils';

// Load Config and Locale
export const Config: RostConfig = JSON.parse(
  LoadResourceFile(GetCurrentResourceName(), 'dist/config.json'),
);
export const Locales = JSON.parse(
  LoadResourceFile(GetCurrentResourceName(), `dist/locales/${Config.locale}.json`),
);

export let CurrentProximityRange = 1;
export let CurrentVoiceTarget = 1;

const ActiveTargets: TargetList = new TargetList();

export function ChangeVoiceTarget(targetID: number): void {
  CurrentVoiceTarget = targetID;

  MumbleSetVoiceTarget(targetID);

  Debug(`[Main] Voice Target Changed | Target ID '${targetID}'`);
}

export function RefreshTargets(): void {
  const voiceTarget = CurrentVoiceTarget === 1 ? 2 : 1;

  MumbleClearVoiceTarget(voiceTarget);

  ActiveTargets.setTargets(voiceTarget);

  ChangeVoiceTarget(voiceTarget);

  Debug(`[Main] Target list has been refreshed | Target ID: ${voiceTarget}`);
}

export function AddPlayerToTargetList(playerID: number): void {
  if (ActiveTargets.exist(playerID)) return;

  MumbleAddVoiceTargetPlayer(CurrentVoiceTarget, playerID);

  ActiveTargets.add(playerID);

  Debug(
    `[Main] Added Player to Target List | Target ID '${CurrentVoiceTarget}' | Player ID '${playerID}'`,
  );
}

export function RemovePlayerFromTargetList(playerID: number): void {
  if (!ActiveTargets.exist(playerID)) return;

  ActiveTargets.remove(playerID);

  RefreshTargets();

  Debug(
    `[Main] Removed player from target list | Target ID '${CurrentVoiceTarget}' | Player ID '${playerID}'`,
  );
}

function CycleVoiceProximity(): void {
  const newRange = CurrentProximityRange + 1;

  if (typeof Config.voiceRanges[newRange] !== 'undefined') {
    CurrentProximityRange = newRange;
  } else {
    CurrentProximityRange = 0;
  }

  NetworkSetTalkerProximity(Config.voiceRanges[CurrentProximityRange].distance);

  HUD.UpdateHUDProximity(Config.voiceRanges[CurrentProximityRange].name);

  Debug(
    `[Main] Changed Proximity Range | Range  ${Config.voiceRanges[CurrentProximityRange].name} `,
  );
}

async function Init(): Promise<void> {
  RegisterKeyMapping(
    '+cycleProximity',
    _L('cycleProximity'),
    'keyboard',
    Config.cycleProximityHotkey,
  );
  RegisterCommand('+cycleProximity', CycleVoiceProximity.bind(this), false);
  RegisterCommand('-cycleProximity', function() {}, false);

  addEventListener('playerSpawned', ResetVoice);

  if (Config.enablePhoneModule) {
    Phone.LoadModule();
  }

  if (Config.enableRadioModule) {
    Radio.LoadModule();
  }

  await Wait(1000);

  if (Config.enableNUIModule) {
    HUD.LoadModule();
  }

  setTick(async () => {
    const [pX, pY, pZ] = GetEntityCoords(PlayerPedId(), false);

    const activePlayers = GetActivePlayers();

    let refresh = false;

    activePlayers.forEach(async playerID => {
      const [x, y, z] = GetEntityCoords(GetPlayerPed(playerID), false);

      const distance = GetDistanceBetweenCoords(pX, pY, pZ, x, y, z, false);
      // const distance = ((pX - x) ** 2 + (pY - y) ** 2 + (pZ - z) ** 2) ** (1 / 2);

      if (distance <= 128.0) {
        AddPlayerToTargetList(playerID);
      } else if (!Radio.ActiveTargets.exist(playerID) && !Phone.ActiveTargets.exist(playerID)) {
        RemovePlayerFromTargetList(playerID);

        refresh = true;
      }
    });

    if (refresh) RefreshTargets();

    await Wait(200);
  });

  while (!NetworkIsSessionStarted()) {
    await Wait(100);
  }

  ResetVoice();
}

Init();
