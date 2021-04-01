import { RostConfig } from './types/misc';

import PlayerTargetList from './classes/playerTargetList';
import ChannelTargetList from './classes/channelTargetList';

import { getCurrentChunk, getNearbyChunks } from './grid';

import * as Radio from './modules/radio';
import * as Phone from './modules/phone';
import * as HUD from './modules/hud';

import { _L, Debug, Wait, ResetVoice } from './utils/utils';

export const Config: RostConfig = JSON.parse(
  LoadResourceFile(GetCurrentResourceName(), 'dist/config.json'),
);

export const Locales = JSON.parse(
  LoadResourceFile(GetCurrentResourceName(), `dist/locales/${Config.locale}.json`),
);

export let CurrentProximityRange = 1;
export let CurrentVoiceTarget = 1;
let currentChunk: number;

const playerTargets = new PlayerTargetList();
const channelTargets = new ChannelTargetList();

export function ChangeVoiceTarget(targetID: number): void {
  CurrentVoiceTarget = targetID;

  MumbleSetVoiceTarget(targetID);

  Debug(`[Main] Voice Target Changed | Target ID '${targetID}'`);
}

export function RefreshTargets(): void {
  const voiceTarget = CurrentVoiceTarget === 1 ? 2 : 1;

  MumbleClearVoiceTarget(voiceTarget);

  playerTargets.setTargets(voiceTarget);
  channelTargets.setTargets(voiceTarget);

  ChangeVoiceTarget(voiceTarget);

  Debug(`[Main] Target list has been refreshed | Target ID: ${voiceTarget}`);
}

export function AddPlayerToTargetList(playerID: number): void {
  if (playerTargets.exist(playerID)) return;

  MumbleAddVoiceTargetPlayer(CurrentVoiceTarget, playerID);

  playerTargets.add(playerID);

  Debug(
    `[Main] Added Player to Target List | Target ID '${CurrentVoiceTarget}' | Player ID '${playerID}'`,
  );
}

export function RemovePlayerFromTargetList(playerID: number): void {
  if (!playerTargets.exist(playerID)) return;

  playerTargets.remove(playerID);

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

  MumbleSetAudioInputDistance(Config.voiceRanges[CurrentProximityRange].distance);

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

  setInterval(() => {
    const [pX, pY, pZ] = GetEntityCoords(PlayerPedId(), false);

    const chunk = getCurrentChunk({ x: pX, y: pY });
    const nearbyChunks = getNearbyChunks({ x: pX, y: pY });

    if (currentChunk !== chunk) {
      Debug(`Chunk: ${chunk} | Nearby: ${nearbyChunks} `);
      currentChunk = chunk;
      NetworkSetVoiceChannel(currentChunk);

      channelTargets.set([chunk, ...nearbyChunks]);

      if (channelTargets.shouldRefresh()) {
        RefreshTargets();
      }
    }
  }, 200);

  /* setTick(async () => {
    const [pX, pY, pZ] = GetEntityCoords(PlayerPedId(), false);

    const activePlayers = GetActivePlayers();

    let refresh = false;

    activePlayers.forEach(async playerID => {
      const [x, y, z] = GetEntityCoords(GetPlayerPed(playerID), false);

      const distance = GetDistanceBetweenCoords(pX, pY, pZ, x, y, z, false);
      // const distance = ((pX - x) ** 2 + (pY - y) ** 2 + (pZ - z) ** 2) ** (1 / 2);

      if (distance <= 128.0) {
        AddPlayerToTargetList(playerID);
      } else if (!Radio.playerTargets.exist(playerID) && !Phone.playerTargets.exist(playerID)) {
        RemovePlayerFromTargetList(playerID);

        refresh = true;
      }
    });

    if (refresh) RefreshTargets();

    await Wait(200);
  }); */

  while (!NetworkIsSessionStarted()) {
    await Wait(100);
  }

  ResetVoice();
  Debug(`[Main] Voice started!`);
}

on('onClientResourceStart', (resource: string) => {
  if (resource !== GetCurrentResourceName()) {
    return;
  }

  Init();
});
