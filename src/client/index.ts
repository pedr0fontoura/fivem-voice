import { VoiceConfig } from './types/misc';

import PlayerTargetList from './classes/playerTargetList';

import { getCurrentChunk, getSurroundingChunks } from './grid';

import * as Radio from './modules/radio';
import * as Phone from './modules/phone';
import * as HUD from './modules/hud';

import { _L, debug, Delay, resetVoice } from './utils';

export const Config: VoiceConfig = {
  debugMode: GetConvarInt('voice_debugMode', 2),
  enableRadioModule: !!GetConvarInt('voice_enableRadioModule', 1),
  enablePhoneModule: !!GetConvarInt('voice_enablePhoneModule', 1),
  enableSubmixModule: !!GetConvarInt('voice_enableSubmixModule', 1),
  enableNUIModule: !!GetConvarInt('voice_enableNUIModule', 1),
  enableRemoteClickOn: !!GetConvarInt('voice_enableRemoteClickOn', 0),
  enableRemoteClickOff: !!GetConvarInt('voice_enableRemoteClickOff', 0),
  cycleProximityHotkey: GetConvar('voice_cycleProximityHotkey', 'Z'),
  cycleFrequencyHotkey: GetConvar('voice_cycleFrequencyHotkey', 'I'),
  toggleRadioHotkey: GetConvar('voice_toggleRadioHotkey', 'CAPITAL'),
  locale: GetConvar('voice_locale', 'pt-BR'),
  voiceRanges: [
    { name: 'Whisper', distance: 0.75 },
    { name: 'Normal', distance: 2.0 },
    { name: 'Shout', distance: 5.0 },
    { name: 'Megaphone', distance: 35.0 },
  ],
};

export const Locales = JSON.parse(
  LoadResourceFile(GetCurrentResourceName(), `dist/locales/${Config.locale}.json`),
);

const cachedServerId = GetPlayerServerId(PlayerId());

export let currentProximityRange = 1;
export let currentVoiceTarget = 1;

let isConnected = false;

let updatingChannel = false;

let currentChunk: number;
let channelsListening: number[] = [];

const playerTargets = new PlayerTargetList();

export function changeVoiceTarget(targetID: number): void {
  currentVoiceTarget = targetID;

  MumbleSetVoiceTarget(targetID);

  debug.verbose(`[Main] Voice Target Changed | Target ID '${targetID}'`);
}

export function refreshPlayerTargets(): void {
  MumbleClearVoiceTargetPlayers(currentVoiceTarget);
  playerTargets.setTarget(currentVoiceTarget);

  debug.verbose(`[Main] Player target list has been refreshed | Target ID: ${currentVoiceTarget}`);
}

export function addPlayerToTargetList(playerId: number): void {
  if (playerTargets.exist(playerId)) return;

  MumbleAddVoiceTargetPlayerByServerId(currentVoiceTarget, playerId);

  playerTargets.add(playerId);

  debug.verbose(
    `[Main] Added Player to Target List | Target ID '${currentVoiceTarget}' | Player ID '${playerId}'`,
  );
}

export function removePlayerFromTargetList(playerId: number): void {
  if (!playerTargets.exist(playerId)) return;

  playerTargets.remove(playerId);

  refreshPlayerTargets();

  debug.verbose(
    `[Main] Removed player from target list | Target ID ${currentVoiceTarget} | Player ID ${playerId}`,
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

  debug.log(
    `[Main] Changed Proximity Range | Range ${Config.voiceRanges[currentProximityRange].name}`,
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

  if (Config.enableNUIModule) {
    await Delay(1000);

    HUD.loadModule();
  }

  while (!MumbleIsConnected() || !NetworkIsSessionStarted()) {
    await Delay(0);
  }

  resetVoice();

  setInterval(async () => {
    if (updatingChannel) return;

    const isMumbleConnected = MumbleIsConnected();

    if (isConnected !== isMumbleConnected) {
      if (isMumbleConnected) {
        isConnected = true;
      } else {
        isConnected = false;
        currentChunk = null;
        return;
      }
    }

    const [pX, pY] = GetEntityCoords(PlayerPedId(), false);

    const chunk = getCurrentChunk({ x: pX, y: pY });

    if (currentChunk !== chunk) {
      debug.log(`[Main] Updating chunk from ${currentChunk} to ${chunk}`);

      updatingChannel = true;

      NetworkSetVoiceChannel(chunk);

      while (MumbleGetVoiceChannelFromServerId(cachedServerId) !== chunk) {
        await Delay(0);
      }

      channelsListening.forEach(channel => MumbleRemoveVoiceChannelListen(channel));

      MumbleClearVoiceTargetChannels(currentVoiceTarget);

      const nearbyChunks = getSurroundingChunks({ x: pX, y: pY });

      nearbyChunks.forEach(channel => MumbleAddVoiceChannelListen(channel));

      MumbleAddVoiceTargetChannel(currentVoiceTarget, chunk);

      currentChunk = chunk;
      channelsListening = nearbyChunks;

      updatingChannel = false;

      debug.verbose(`[Main] ${currentChunk} | [${nearbyChunks}]`);
    }
  }, 200);

  debug.log(`[Main] Voice started!`);
}

init();
