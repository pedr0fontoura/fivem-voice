import * as ServerState from './modules/serverState';
import * as Phone from './modules/phone';
import * as Radio from './modules/radio';

import { debug } from './utils/utils';

import { VoiceConfig } from './types/misc';

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

async function init(): Promise<void> {
  SetConvarReplicated('voice_useNativeAudio', 'true');
  SetConvarReplicated('voice_useSendingRangeOnly', 'true');

  debug.log(`[Main] Starting ...`);

  ServerState.loadModule();

  if (Config.enablePhoneModule) {
    Phone.loadModule();
  }

  if (Config.enableRadioModule) {
    Radio.loadModule();
  }

  debug.log('[Main] FiveM Voice started!');
}

init();
