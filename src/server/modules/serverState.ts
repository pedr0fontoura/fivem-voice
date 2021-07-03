import { debug } from '../utils/utils';

interface PlayerState {
  id: number;
  currentChunk: number;
  nearbyChunks: number[];
}

const players: PlayerState[] = [];

const activeChannels = new Map<number, Set<number>>();
const pendingChannels = new Map<number, Set<number>>();

function connectPlayer(): void {
  const serverId = parseInt(source);

  if (players.find(player => player.id === serverId)) return;

  players.push({
    id: serverId,
    currentChunk: undefined,
    nearbyChunks: [],
  });

  debug.verbose(`[Server State] Player ${serverId} state tracked`);
}

function disconnectPlayer(): void {
  const serverId = parseInt(source);

  const playerIndex = players.findIndex(player => player.id === serverId);

  if (!players[playerIndex]) return;

  const playerState = players[playerIndex];

  players.splice(playerIndex, 1);

  const activeChannelPlayerList = activeChannels.get(playerState.currentChunk);

  activeChannelPlayerList.delete(serverId);

  if (activeChannelPlayerList.size === 0) {
    activeChannels.delete(playerState.currentChunk);
  }

  playerState.nearbyChunks.forEach(nearbyChunk => {
    if (!pendingChannels.has(nearbyChunk)) return;

    const pendingChannelPlayerList = pendingChannels.get(nearbyChunk);

    pendingChannelPlayerList.delete(serverId);

    if (pendingChannelPlayerList.size === 0) {
      pendingChannels.delete(nearbyChunk);
    }
  });

  debug.verbose(`[Server State] Player ${serverId} state untracked`);
}

function addActiveChannel(channel: number, players: number[] = []): void {
  const channelPlayerList = new Set<number>(players);

  activeChannels.set(channel, channelPlayerList);

  // Check if newly created channel was pending, if true then remove it from pendingChannels
  // and trigger channel targets refresh for relevant players
  if (pendingChannels.has(channel)) {
    debug.verbose(`[Server State] Triggering channelTargets refresh for players [${Array.from(pendingChannels.get(channel).keys())}]`);

    pendingChannels.get(channel).forEach(playerId => {

      TriggerClientEvent('voice:player:refreshChannelTargets', playerId);
    });

    // Remove pending channel
    pendingChannels.delete(channel);
  }
}

function addPendingChannel(channel: number, players: number[] = []): void {
  const channelPlayerList = new Set<number>(players);

  pendingChannels.set(channel, channelPlayerList);
}

function removePlayerFromActiveChannel(playerId: number, channel: number): void {
  if (!activeChannels.has(channel)) return;

  const activeChannelPlayerList = activeChannels.get(channel);

  activeChannelPlayerList.delete(playerId);

  if (activeChannelPlayerList.size === 0) {
    activeChannels.delete(channel);

    if (players.some(player => player.nearbyChunks.includes(channel))) {
      const playerIds = players.filter(player => player.nearbyChunks.includes(channel)).map(player => player.id);

      addPendingChannel(channel, playerIds);

      debug.verbose(`[Server State] Added channel ${channel} to pending channels`);
    }
  }
}

function removePlayerFromPendingChannels(playerId: number, channels: number[]): void {
  channels.forEach(channel => {
    if (!pendingChannels.has(channel)) return;

    const pendingChannelPlayerList = pendingChannels.get(channel);

    pendingChannelPlayerList.delete(playerId);

    if (pendingChannelPlayerList.size === 0) {
      pendingChannels.delete(channel);
    }
  });
}

function updatePlayerState(rawState: Omit<PlayerState, 'id'>): void {
  const serverId = parseInt(source);

  const playerState = { ...rawState, id: serverId };

  const playerIndex = players.findIndex(player => player.id === serverId);

  const previousPlayerState = players[playerIndex];

  if (previousPlayerState.currentChunk) {
    const previousChunk = previousPlayerState.currentChunk;
    const previousNearbyChunks = previousPlayerState.nearbyChunks;

    removePlayerFromActiveChannel(serverId, previousChunk);
    removePlayerFromPendingChannels(serverId, previousNearbyChunks);
  }

  // If currentChunk channel already exists, add player to channel's player list
  // and if currentChunk channel doesn't exist, add channel to activeChannels.
  if (activeChannels.has(playerState.currentChunk)) {
    activeChannels.get(playerState.currentChunk).add(serverId);
  } else {
    addActiveChannel(playerState.currentChunk, [serverId]);

    debug.verbose(`[Server State] Added channel ${playerState.currentChunk} to active channels`);
  }

  // If nearbyChunk channel already exists, add player to channel's player list
  // and if nearbyChunk channel doesn't exist, add channel to pendingChannels.
  const addedPendingChannels = [];

  playerState.nearbyChunks.forEach(nearbyChunk => {
    if (activeChannels.has(nearbyChunk)) return;

    if (pendingChannels.has(nearbyChunk)) {
      pendingChannels.get(nearbyChunk).add(serverId);
    } else {
      addPendingChannel(nearbyChunk, [serverId]);

      addedPendingChannels.push(nearbyChunk);
    }
  });

  if (addedPendingChannels.length > 0) {
    debug.verbose(`[Server State] Added channels ${addedPendingChannels} to pending channels`);
  }

  players[playerIndex] = playerState;
}

export async function loadModule(): Promise<void> {
  debug.log(`[Server State] Module Loaded`);

  onNet('voice:player:connected', connectPlayer.bind(this));
  onNet('voice:player:disconnected', disconnectPlayer.bind(this));

  onNet('voice:player:updateServerState', updatePlayerState.bind(this));
}
