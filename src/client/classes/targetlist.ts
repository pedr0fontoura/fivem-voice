export class TargetList {
  public targets: Array<number> = [];

  constructor() {}

  exist(playerID): boolean {
    return this.targets.some(target => target === playerID);
  }

  add(playerID): void {
    if (this.exist(playerID)) return;

    this.targets.push(playerID);
  }

  remove(playerID): void {
    const index = this.targets.findIndex(target => target === playerID);

    if (index === -1) return;

    this.targets.splice(index, 1);
  }

  setTargets(targetID: number): void {
    this.targets.forEach(playerID => {
      MumbleAddVoiceTargetPlayer(targetID, playerID);
    });
  }

  wipe(): void {
    this.targets = [];
  }
}
