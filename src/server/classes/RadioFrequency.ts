import { RadioListener } from '../types/misc';

export default class RadioFrequency {
  public radioId: string;

  private authorization: Function;
  private listeners: Array<RadioListener> = [];

  constructor(radioId: string) {
    this.radioId = radioId;

    this.authorization = (): boolean => {
      return true;
    };
  }

  setAuthorization(authorization: Function): void {
    this.authorization = authorization;
  }

  hasAuthorization(serverId: number): boolean {
    return this.authorization(serverId, this.radioId, this.listeners.length);
  }

  exist(serverId: number): boolean {
    return this.listeners.some(listener => listener.serverId === serverId);
  }

  addListener(serverId: number): void {
    if (this.exist(serverId)) return;

    this.listeners.push({ serverId: serverId, transmitting: false });

    this.listeners.forEach(listener => {
      if (listener.serverId !== serverId) {
        TriggerClientEvent('naxel:player:radio:added', listener.serverId, this.radioId, serverId);
      }
    });

    TriggerClientEvent('naxel:player:radio:connect', serverId, this.radioId, this.listeners);
  }

  removeListener(serverId: number): void {
    const userIndex = this.listeners.findIndex(listener => listener.serverId === serverId);

    if (userIndex === -1) return;

    this.listeners.splice(userIndex, 1);

    this.listeners.forEach(listener => {
      TriggerClientEvent('naxel:player:radio:removed', listener.serverId, this.radioId, serverId);
    });

    TriggerClientEvent('naxel:player:radio:disconnect', serverId, this.radioId);
  }

  setTransmission(serverId: number, active: boolean): void {
    if (!this.exist(serverId)) return;

    this.listeners.forEach(listener => {
      if (listener.serverId !== serverId) {
        TriggerClientEvent(
          'naxel:player:radio:listen',
          listener.serverId,
          this.radioId,
          serverId,
          active,
        );
      } else {
        listener.transmitting = active;
      }
    });
  }
}
