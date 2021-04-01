export default class PlayerTargetList {
  private targets: Array<number> = [];

  constructor() {}

  exist(playerId: number): boolean {
    return this.targets.some(target => target === playerId);
  }

  add(playerId: number): void {
    if (this.exist(playerId)) return;

    this.targets.push(playerId);
  }

  remove(playerId: number): void {
    const index = this.targets.findIndex(target => target === playerId);

    if (index === -1) return;

    this.targets.splice(index, 1);
  }

  setTargets(targetId: number): void {
    this.targets.forEach(playerId => {
      MumbleAddVoiceTargetPlayerByServerId(targetId, playerId);
    });
  }

  wipe(): void {
    this.targets = [];
  }
}
