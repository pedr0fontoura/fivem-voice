import * as Radio from './modules/radio';
import * as Phone from './modules/phone';

import { RostConfig } from './types/misc';

export const Config: RostConfig = JSON.parse(LoadResourceFile(GetCurrentResourceName(), 'dist/config.json'));
export const Locales = JSON.parse(LoadResourceFile(GetCurrentResourceName(), `dist/locales/${Config.locale}.json`));

async function Init(): Promise<void> {
    if (Config.enablePhoneModule) {
        Phone.LoadModule();
    }

    if (Config.enableRadioModule) {
        Radio.LoadModule();
    }
}

Init();
