export class TargetList {
    public targets: Array<number> = [];

    constructor() {}

    add(playerID): void {
        const exist = this.targets.some(target => target === playerID);

        if (exist) return;

        this.targets.push(playerID);
    }

    remove(playerID): void {
        const index = this.targets.findIndex(target => target === playerID);

        if (index === -1) return;

        this.targets.splice(index, 1);
    }

    exist(playerID): boolean {
        return this.targets.some(target => target === playerID);
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
