import { RostConfig } from './types/misc';

import PlayerTargetList from './classes/playerTargetList';
import ChannelTargetList from './classes/channelTargetList';

import { getCurrentChunk, getNearbyChunks } from './grid';

import * as Radio from './modules/radio';
import * as Phone from './modules/phone';
import * as HUD from './modules/hud';

import { _L, debug, Wait, resetVoice } from './utils';

export const Config: RostConfig = JSON.parse(
  LoadResourceFile(GetCurrentResourceName(), 'dist/config.json'),
);

export const Locales = JSON.parse(
  LoadResourceFile(GetCurrentResourceName(), `dist/locales/${Config.locale}.json`),
);

export let currentProximityRange = 1;
export let currentVoiceTarget = 1;

let currentChunk: number;

const playerTargets = new PlayerTargetList();
const channelTargets = new ChannelTargetList();

export function changeVoiceTarget(targetID: number): void {
  currentVoiceTarget = targetID;

  MumbleSetVoiceTarget(targetID);

  debug(`[Main] Voice Target Changed | Target ID '${targetID}'`);
}

export function refreshTargets(): void {
  const voiceTarget = currentVoiceTarget === 1 ? 2 : 1;

  MumbleClearVoiceTarget(voiceTarget);

  playerTargets.setTargets(voiceTarget);
  channelTargets.setTargets(voiceTarget);

  changeVoiceTarget(voiceTarget);

  debug(`[Main] Target list has been refreshed | Target ID: ${voiceTarget}`);
}

export function addPlayerToTargetList(playerID: number): void {
  if (playerTargets.exist(playerID)) return;

  MumbleAddVoiceTargetPlayerByServerId(currentVoiceTarget, playerID);

  playerTargets.add(playerID);

  debug(
    `[Main] Added Player to Target List | Target ID '${currentVoiceTarget}' | Player ID '${playerID}'`,
  );
}

export function removePlayerFromTargetList(playerID: number): void {
  if (!playerTargets.exist(playerID)) return;

  playerTargets.remove(playerID);

  refreshTargets();

  debug(
    `[Main] Removed player from target list | Target ID '${currentVoiceTarget}' | Player ID '${playerID}'`,
  );
}

function cycleVoiceProximity(): void {
  const newRange = currentProximityRange + 1;

  if (!Config.voiceRanges[newRange]) {
    currentProximityRange = newRange;
  } else {
    currentProximityRange = 0;
  }

  MumbleSetAudioInputDistance(Config.voiceRanges[currentProximityRange].distance);

  HUD.updateHUDProximity(Config.voiceRanges[currentProximityRange].name);

  debug(
    `[Main] Changed Proximity Range | Range  ${Config.voiceRanges[currentProximityRange].name} `,
  );
}

async function init(): Promise<void> {
  RegisterKeyMapping(
    '+cycleProximity',
    _L('cycleProximity'),
    'keyboard',
    Config.cycleProximityHotkey,
  );
  RegisterCommand('+cycleProximity', cycleVoiceProximity.bind(this), false);
  RegisterCommand('-cycleProximity', function () {}, false);

  if (Config.enablePhoneModule) {
    Phone.LoadModule();
  }

  if (Config.enableRadioModule) {
    Radio.LoadModule();
  }

  await Wait(1000);

  if (Config.enableNUIModule) {
    HUD.loadModule();
  }

  while (!MumbleIsConnected() || !NetworkIsSessionStarted()) {
    await Wait(250);
  }

  resetVoice();

  setInterval(() => {
    const [pX, pY, pZ] = GetEntityCoords(PlayerPedId(), false);

    const chunk = getCurrentChunk({ x: pX, y: pY });
    const nearbyChunks = getNearbyChunks({ x: pX, y: pY });

    if (currentChunk !== chunk) {
      debug(`Chunk: ${chunk} | Nearby: ${nearbyChunks} `);
      currentChunk = chunk;
      NetworkSetVoiceChannel(currentChunk);

      channelTargets.set([chunk, ...nearbyChunks]);

      if (channelTargets.shouldRefresh()) {
        refreshTargets();
      }
    }
  }, 200);

  debug(`[Main] Voice started!`);
}

on('onClientResourceStart', (resource: string) => {
  if (resource !== GetCurrentResourceName()) {
    return;
  }

  init();
});
