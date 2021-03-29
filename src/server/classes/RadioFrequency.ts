import { RadioListener } from '../types/misc';

export class RadioFrequency {
  public radioID: string;

  private authorization: Function;
  private listeners: Array<RadioListener> = [];

  constructor(radioID: string) {
    this.radioID = radioID;

    this.authorization = (): boolean => {
      return true;
    };
  }

  setAuthorization(authorization: Function): void {
    this.authorization = authorization;
  }

  hasAuthorization(serverID: number): boolean {
    return this.authorization(serverID, this.radioID, this.listeners.length);
  }

  exist(serverID: number): boolean {
    return this.listeners.some(listener => listener.serverID === serverID);
  }

  addListener(serverID: number): void {
    if (this.exist(serverID)) return;

    this.listeners.push({ serverID: serverID, transmitting: false });

    this.listeners.forEach(listener => {
      if (listener.serverID !== serverID) {
        TriggerClientEvent('naxel:player:radio:added', listener.serverID, this.radioID, serverID);
      }
    });

    TriggerClientEvent('naxel:player:radio:connect', serverID, this.radioID, this.listeners);
  }

  removeListener(serverID: number): void {
    const userIndex = this.listeners.findIndex(listener => listener.serverID === serverID);

    if (userIndex === -1) return;

    this.listeners.splice(userIndex, 1);

    this.listeners.forEach(listener => {
      TriggerClientEvent('naxel:player:radio:removed', listener.serverID, this.radioID, serverID);
    });

    TriggerClientEvent('naxel:player:radio:disconnect', serverID, this.radioID);
  }

  setTransmission(serverID: number, active: boolean): void {
    if (!this.exist(serverID)) return;

    this.listeners.forEach(listener => {
      if (listener.serverID !== serverID) {
        TriggerClientEvent(
          'naxel:player:radio:listen',
          listener.serverID,
          this.radioID,
          serverID,
          active,
        );
      } else {
        listener.transmitting = active;
      }
    });
  }
}
