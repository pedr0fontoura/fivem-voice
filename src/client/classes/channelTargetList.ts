export default class ChannelTargetList {
  private targets: Map<number, boolean>;
  private lastTargets: Map<number, boolean>;

  constructor() {
    this.targets = new Map<number, boolean>();
    this.lastTargets = new Map<number, boolean>();
  }

  set(channels: number[]): void {
    this.targets = new Map<number, boolean>();

    channels.forEach(channelId => {
      this.targets.set(channelId, true);
    });
  }

  shouldRefresh(): boolean {
    for (const channelId of this.targets.keys()) {
      if (!this.lastTargets.has(channelId)) {
        return true;
      }
    }

    return false;
  }

  setTarget(targetId: number): void {
    for (const channelId of this.targets.keys()) {
      MumbleAddVoiceTargetChannel(targetId, channelId);
    }

    this.lastTargets = this.targets;
  }
}
