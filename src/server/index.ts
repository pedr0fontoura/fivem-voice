import * as Radio from './modules/radio';
import * as Phone from './modules/phone';

import { Debug } from './utils/utils';

import { RostConfig } from './types/misc';

const MAP_SIZE = 8192;
const CHUNK_SIZE = 256;

export const Config: RostConfig = JSON.parse(
  LoadResourceFile(GetCurrentResourceName(), 'dist/config.json'),
);
export const Locales = JSON.parse(
  LoadResourceFile(GetCurrentResourceName(), `dist/locales/${Config.locale}.json`),
);

function getChunkId(vector: Vector2): number {
  return (vector.x << 8) | vector.y;
}

function createChannels(): void {
  const numberOfChunks = MAP_SIZE / CHUNK_SIZE;
  let n = 0;

  Debug(`[Main] Creating Mumble channels ...`);
  for (let x = 0; x < numberOfChunks; x++) {
    for (let y = 0; y < numberOfChunks; y++) {
      MumbleCreateChannel(getChunkId({ x, y }));
      n++;
    }
  }

  Debug(`[Main] Total channels created: ${n}`);
}

async function Init(): Promise<void> {
  SetConvarReplicated('voice_useNativeAudio', 'true');
  SetConvarReplicated('voice_useSendingRangeOnly', 'true');

  Debug(`[Main] Starting ...`);
  createChannels();

  if (Config.enablePhoneModule) {
    Phone.LoadModule();
  }

  if (Config.enableRadioModule) {
    Radio.LoadModule();
  }
}

on('onServerResourceStart', (resource: string) => {
  if (resource !== GetCurrentResourceName()) {
    return;
  }

  Init();
});
