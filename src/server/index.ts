import * as Radio from './modules/radio';
import * as Phone from './modules/phone';

import { debug } from './utils/utils';

import { VoiceConfig } from './types/misc';

const MAP_SIZE = 8192;
const CHUNK_SIZE = 512;

export const Config: VoiceConfig = {
  debugMode: GetConvarInt('voice_debugMode', 0),
  enableRadioModule: !!GetConvarInt('voice_enableRadioModule', 1),
  enablePhoneModule: !!GetConvarInt('voice_enablePhoneModule', 1),
  enableNUIModule: !!GetConvarInt('voice_enableNUIModule', 1),
  enableRemoteClickOn: !!GetConvarInt('voice_enableRemoteClickOn', 0),
  enableRemoteClickOff: !!GetConvarInt('voice_enableRemoteClickOff', 1),
  cycleProximityHotkey: GetConvar('voice_cycleProximityHotkey', 'Z'),
  cycleFrequencyHotkey: GetConvar('voice_cycleFrequencyHotkey', 'I'),
  toggleRadioHotkey: GetConvar('voice_toggleRadioHotkey', 'CAPITAL'),
  locale: GetConvar('voice_locale', 'pt-BR'),
};

export const Locales = JSON.parse(
  LoadResourceFile(GetCurrentResourceName(), `dist/locales/${Config.locale}.json`),
);

function createChannels(): void {
  const numberOfChunks = (MAP_SIZE * 2) / CHUNK_SIZE;
  let n = 0;

  debug.log(`[Main] Creating Mumble channels ...`);

  for (let channelId = 0; channelId < numberOfChunks ** 2; channelId++) {
    MumbleCreateChannel(channelId);
    n++;
  }

  debug.log(`[Main] Total channels created: ${n}`);
}

async function init(): Promise<void> {
  SetConvarReplicated('voice_useNativeAudio', 'true');
  SetConvarReplicated('voice_useSendingRangeOnly', 'true');

  debug.log(`[Main] Starting ...`);

  createChannels();

  if (Config.enablePhoneModule) {
    Phone.loadModule();
  }

  if (Config.enableRadioModule) {
    Radio.loadModule();
  }

  debug.log('[Main] FiveM Voice started!');
}

on('onServerResourceStart', (resource: string) => {
  if (resource !== GetCurrentResourceName()) {
    return;
  }

  init();
});
