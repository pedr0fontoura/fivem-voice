import RadioFrequency from '../classes/RadioFrequency';
import { debug } from '../utils/utils';

const exp = (<any>global).exports;

const radioFrequencies: Array<RadioFrequency> = [];

function registerRadioFrequency(radioId: string, authorization?: Function): void {
  if (authorization && typeof authorization !== 'function') {
    console.error(`Unable to Register Frequency '${radioId}', @P2 value must be of type: Function`);
    return;
  }

  let radioFrequency = radioFrequencies.find(frequency => frequency.radioId === radioId);

  if (!radioFrequency) {
    radioFrequency = new RadioFrequency(radioId);

    radioFrequencies.push(radioFrequency);
  }

  if (authorization) radioFrequency.setAuthorization(authorization);
}

function addPlayerToRadio(serverId: number, radioId: string): void {
  let radioFrequency = radioFrequencies.find(frequency => frequency.radioId === radioId);

  if (!radioFrequency) {
    radioFrequency = new RadioFrequency(radioId);

    radioFrequencies.push(radioFrequency);
  }

  if (radioFrequency.exist(serverId)) return;

  const authorized = radioFrequency.hasAuthorization(serverId);

  if (authorized) {
    radioFrequency.addListener(serverId);

    debug(`[Radio] Player Added to Radio | Server ID '${serverId} | Radio ID '${radioId}'`);
  }
}

function removePlayerFromRadio(serverId: number, radioId: string): void {
  const radioFrequency = radioFrequencies.find(frequency => frequency.radioId === radioId);

  if (radioFrequency) {
    radioFrequency.removeListener(serverId);

    debug(`[Radio] Player Removed from Radio | Server ID '${serverId} | Radio ID '${radioId}'`);
  }
}

function removePlayerFromAllRadios(serverId: number): void {
  radioFrequencies.forEach(frequency => {
    frequency.removeListener(serverId);
  });
}

function setPlayerTransmission(radioId: string, transmit: boolean): void {
  const frequency = radioFrequencies.find(frequency => frequency.radioId === radioId);

  if (frequency) {
    const serverId = parseInt(source);

    frequency.setTransmission(serverId, transmit);

    debug(`[Radio] Transmitting: ${transmit} | Server ID '${serverId} | Radio ID '${radioId}'`);
  }
}

function setPlayerRadioPowerState(serverId: number, state: boolean): void {
  TriggerClientEvent('naxel:player:radio:power', serverId, state);
}

function setPlayerRadioVolume(serverId: number, volume: number): void {
  TriggerClientEvent('naxel:player:radio:volume', serverId, volume);
}

export async function loadModule(): Promise<void> {
  addNetEventListener('naxel:player:radio:transmission', setPlayerTransmission.bind(this));

  exp('setPlayerRadioPowerState', setPlayerRadioPowerState);
  exp('setPlayerRadioVolume', setPlayerRadioVolume);
  exp('registerRadioFrequency', registerRadioFrequency);
  exp('addPlayerToRadio', addPlayerToRadio);
  exp('removePlayerFromRadio', removePlayerFromRadio);
  exp('removePlayerFromAllRadios', removePlayerFromAllRadios);

  AddEventHandler('playerDropped', () => {
    const serverId = parseInt(source);

    removePlayerFromAllRadios(serverId);
  });

  debug(`[Radio] Module Loaded`);
}
