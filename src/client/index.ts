import { RostConfig } from './types/misc';

import PlayerTargetList from './classes/playerTargetList';
import ChannelTargetList from './classes/channelTargetList';

import { getCurrentChunk, getSurroundingChunks } from './grid';

import * as Radio from './modules/radio';
import * as Phone from './modules/phone';
import * as HUD from './modules/hud';

import { _L, debug, Delay, resetVoice } from './utils';

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

export function refreshPlayerTargets(): void {
  MumbleClearVoiceTargetPlayers(currentVoiceTarget);
  playerTargets.setTarget(currentVoiceTarget);

  debug(`[Main] Player target list has been refreshed | Target ID: ${currentVoiceTarget}`);
}

export function refreshChannelTargets(): void {
  MumbleClearVoiceTargetChannels(currentVoiceTarget);
  channelTargets.setTarget(currentVoiceTarget);

  debug(`[Main] Channel target list has been refreshed | Target ID: ${currentVoiceTarget}`);
}

export function addPlayerToTargetList(playerId: number): void {
  if (playerTargets.exist(playerId)) return;

  MumbleAddVoiceTargetPlayerByServerId(currentVoiceTarget, playerId);

  playerTargets.add(playerId);

  debug(
    `[Main] Added Player to Target List | Target ID '${currentVoiceTarget}' | Player ID '${playerId}'`,
  );
}

export function removePlayerFromTargetList(playerId: number): void {
  if (!playerTargets.exist(playerId)) return;

  playerTargets.remove(playerId);

  refreshPlayerTargets();

  debug(
    `[Main] Removed player from target list | Target ID '${currentVoiceTarget}' | Player ID '${playerId}'`,
  );
}

function cycleVoiceProximity(): void {
  const newRange = currentProximityRange + 1;

  if (Config.voiceRanges[newRange]) {
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
    Phone.loadModule();
  }

  if (Config.enableRadioModule) {
    Radio.loadModule();
  }

  await Delay(1000);

  if (Config.enableNUIModule) {
    HUD.loadModule();
  }

  while (!MumbleIsConnected() || !NetworkIsSessionStarted()) {
    await Delay(250);
  }

  resetVoice();

  setInterval(async () => {
    while (!MumbleIsConnected()) {
      currentChunk = -1;
      await Delay(100);
    }

    const [pX, pY, pZ] = GetEntityCoords(PlayerPedId(), false);

    const chunk = getCurrentChunk({ x: pX, y: pY });

    if (currentChunk !== chunk) {
      debug(`[Main] Updating chunk from ${currentChunk} to ${chunk}`);

      currentChunk = chunk;

      MumbleClearVoiceTargetChannels(1);
      NetworkSetVoiceChannel(currentChunk);

      const nearbyChunks = getSurroundingChunks({ x: pX, y: pY });

      channelTargets.set([chunk, ...nearbyChunks]);
      channelTargets.setTarget(1);

      debug(`${currentChunk} | [${nearbyChunks}]`);
    }
  }, 200);

  debug(`[Main] Voice started!`);
}

on('onClientResourceStart', (resource: string) => {
  if (resource !== GetCurrentResourceName()) {
    return;
  }

  RegisterCommand(
    'targets',
    () => {
      console.log(playerTargets.targets);
    },
    false,
  );

  init();
});
