import { RadioFrequency } from '../classes/RadioFrequency';
import { Debug } from '../utils/utils';

const RadioFrequencies: Array<RadioFrequency> = [];

function RegisterRadioFrequency(radioID: string, authorization?: Function): void {
    if (authorization && typeof authorization !== 'function') {
        console.error(`Unable to Register Frequency '${radioID}', @P2 value must be of type: Function`);
        return;
    }

    let radioFrequency = RadioFrequencies.find(frequency => frequency.radioID === radioID);

    if (typeof radioFrequency === 'undefined') {
        radioFrequency = new RadioFrequency(radioID);

        RadioFrequencies.push(radioFrequency);
    }

    if (authorization) radioFrequency.setAuthorization(authorization);
}

function AddPlayerToRadio(serverID: number, radioID: string): void {
    let radioFrequency = RadioFrequencies.find(frequency => frequency.radioID === radioID);

    if (typeof radioFrequency === 'undefined') {
        radioFrequency = new RadioFrequency(radioID);

        RadioFrequencies.push(radioFrequency);
    }

    if (radioFrequency.exist(serverID)) return;

    const authorized = radioFrequency.hasAuthorization(serverID);

    if (authorized) {
        radioFrequency.addListener(serverID);

        Debug(`[Radio] Player Added to Radio | Server ID '${serverID} | Radio ID '${radioID}'`);
    }
}

function RemovePlayerFromRadio(serverID: number, radioID: string): void {
    const radioFrequency = RadioFrequencies.find(frequency => frequency.radioID === radioID);

    if (typeof radioFrequency !== 'undefined') {
        radioFrequency.removeListener(serverID);

        Debug(`[Radio] Player Removed from Radio | Server ID '${serverID} | Radio ID '${radioID}'`);
    }
}

function RemovePlayerFromAllRadios(serverID: number): void {
    RadioFrequencies.forEach(frequency => {
        frequency.removeListener(serverID);
    });
}

function SetPlayerTransmission(radioID: string, transmit: boolean): void {
    const frequency = RadioFrequencies.find(frequency => frequency.radioID === radioID);

    if (typeof frequency !== 'undefined') {
        const serverID = Number(source);

        frequency.setTransmission(serverID, transmit);

        Debug(`[Radio] Transmitting: ${transmit} | Server ID '${serverID} | Radio ID '${radioID}'`);
    }
}

function SetPlayerRadioPowerState(serverID: number, state: boolean): void {
    TriggerClientEvent('naxel:player:radio:power', serverID, state);
}

function SetPlayerRadioVolume(serverID: number, volume: number): void {
    TriggerClientEvent('naxel:player:radio:volume', serverID, volume);
}

export async function LoadModule(): Promise<void> {
    addNetEventListener('naxel:player:radio:transmission', SetPlayerTransmission.bind(this));

    exports('SetPlayerRadioPowerState', SetPlayerRadioPowerState);

    exports('SetPlayerRadioVolume', SetPlayerRadioVolume);

    exports('RegisterRadioFrequency', RegisterRadioFrequency);

    exports('AddPlayerToRadio', AddPlayerToRadio);

    exports('RemovePlayerFromRadio', RemovePlayerFromRadio);

    exports('RemovePlayerFromAllRadios', RemovePlayerFromAllRadios);

    AddEventHandler('playerDropped', () => {
        const serverID = Number(source);

        RemovePlayerFromAllRadios(serverID);
    });

    Debug(`[Radio] Module Loaded`);
}
