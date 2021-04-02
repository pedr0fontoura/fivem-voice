/* 
  Actual map size is 16384x16384, coords go from -8192 to 8192 (from d-bub and smallo)

  From my tests (doesn't really matter):
  x range -> -8000 to 8000, if you go beyond that you die.
  y range -> -8192 to some value greater than 8192. Weird?

  This code makes a lot more sense with properly named variables.

  Thanks to d-bub for the grid concept.
  
  - Snake
*/

const MAP_SIZE = 8192;
const CHUNK_SIZE = 512;
const NUMBER_OF_CHUNKS = (MAP_SIZE * 2) / CHUNK_SIZE;
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

/* Get the chunk start coords */
function getGridBase(chunk: number): number {
  return chunk * CHUNK_SIZE - MAP_SIZE;
}

/* Get the chunk center coords */
function getGridCenter(chunk: number): number {
  return chunk * CHUNK_SIZE - MAP_SIZE + CHUNK_SIZE / 2;
}

/*
  Generates a unique id for each chunk using bit shift, basically we put the values of x and y in the same int

  e.g:
  Chunk { x = 64, y = 64 }

  x = 1000000
  y = 1000000
  id = 11111100111111
*/
function getBitShiftedChunkId(vector: Vector2): number {
  return (vector.x << 8) | vector.y;
}

/* Get the chunk index like if the grid was an array. */
function getChunkId(vector: Vector2): number {
  return vector.x * NUMBER_OF_CHUNKS + vector.y;
}

/* Get the id of the current chunk given the Vector2 */
export function getCurrentChunk(vector: Vector2): number {
  const chunk = { x: getGridChunk(vector.x), y: getGridChunk(vector.y) };
  const chunkId = getChunkId(chunk);

  return chunkId;
}

/* Get the id of the chunks near the given Vector2 */
export function getNearbyChunks(vector: Vector2): number[] {
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

/* Get the id of the chunks near the center of the given Vector 2 chunk */
export function getSurroundingChunks(vector: Vector2): number[] {
  const surroundingChunks: number[] = [];

  const vectorChunk = { x: getGridChunk(vector.x), y: getGridChunk(vector.y) };

  DELTAS.forEach(delta => {
    const surroundingChunkCoords = {
      x: getGridCenter(vectorChunk.x) + delta.x * NEARBY_CHUNK_DISTANCE,
      y: getGridCenter(vectorChunk.y) + delta.y * NEARBY_CHUNK_DISTANCE,
    };

    const surroundingChunk = {
      x: getGridChunk(surroundingChunkCoords.x),
      y: getGridChunk(surroundingChunkCoords.y),
    };

    const surroundingChunkId = getChunkId(surroundingChunk);

    surroundingChunks.push(surroundingChunkId);
  });

  return surroundingChunks;
}
