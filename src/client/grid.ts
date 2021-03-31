/* 
  Actual map size is 16384x16384, coords go from -8192 to 8192 (from d-bub and smallo)

  From my tests (doesn't really matter):
  x range -> -8000 to 8000, if you go beyond that you die.
  y range -> -8192 to some value greater than 8192. Weird?

  This code makes a lot more sense with properly named variables.

  Thanks to d-bub for the grid logic.
  
  - Snake
*/

const MAP_SIZE = 8192;
const CHUNK_SIZE = 128;
const NEARBY_CHUNK_DISTANCE = ((CHUNK_SIZE / 2) ** 2 + (CHUNK_SIZE / 2) ** 2) ** (1 / 2);

const DELTAS: Vector2[] = [
  { x: -1, y: -1 },
  { x: -1, y: 0 },
  { x: -1, y: 1 },
  { x: 0, y: -1 },
  { x: 1, y: -1 },
  { x: 1, y: 0 },
  { x: 1, y: 1 },
  { x: 0, y: 1 },
];

/* Get the current chunk based on the passed coord */
function getGridChunk(n: number): number {
  return Math.floor((n + MAP_SIZE) / CHUNK_SIZE);
}

/* Get the coords where the chunk start */
function getGridBase(chunk: number): number {
  return chunk * CHUNK_SIZE - MAP_SIZE;
}

/*
  Generates a unique id for each chunk, basically we put the values of x and y in the same int

  e.g:
  Chunk { x = 64, y = 64 }

  x = 1000000
  y = 1000000
  id = 11111100111111
*/
function getChunkId(vector: Vector2): number {
  return (vector.x << 8) | vector.y;
}

/* Get the id of the chunks near the given vector2 */
function getNearbyChunks(vector: Vector2): number[] {
  const nearbyChunks: number[] = [];

  DELTAS.forEach(delta => {
    const nearbyChunkCoords = {
      x: vector.x + delta.x * NEARBY_CHUNK_DISTANCE,
      y: vector.y + delta.y * NEARBY_CHUNK_DISTANCE,
    };

    const nearbyChunk = {
      x: getGridChunk(nearbyChunkCoords.x),
      y: getGridChunk(nearbyChunkCoords.y),
    };

    const nearbyChunkId = getChunkId(nearbyChunk);

    if (nearbyChunks.includes(nearbyChunkId)) {
      return;
    }

    nearbyChunks.push(nearbyChunkId);
  });

  return nearbyChunks;
}
