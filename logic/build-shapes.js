// The shape of each block in a build, as boxes measured in pixels of its picture (a block is 16 by 16 by 16).
// x runs left to right, y bottom to top, z back to front. A box: { x0, y0, z0, x1, y1, z1 } plus which faces of
// it can be hidden by a neighbour block. Flowers and torches are flat pictures standing up (sprites), not boxes.

// Each side: which way it points, and the neighbour that can hide it.
export const SIDES = {
  north: { dx: 0, dz: -1 },
  south: { dx: 0, dz: 1 },
  west: { dx: -1, dz: 0 },
  east: { dx: 1, dz: 0 },
};

const box = (x0, y0, z0, x1, y1, z1) => ({ x0, y0, z0, x1, y1, z1 });

// Half of a block on one side, between y0 and y1: the tall back of a stair.
function half(side, y0, y1) {
  if (side === 'north') return box(0, y0, 0, 16, y1, 8);
  if (side === 'south') return box(0, y0, 8, 16, y1, 16);
  if (side === 'west') return box(0, y0, 0, 8, y1, 16);
  return box(8, y0, 0, 16, y1, 16);
}

// A thin plate against one side of the block: a ladder on a wall.
function plate(side) {
  if (side === 'north') return box(0, 0, 0, 16, 16, 1);
  if (side === 'south') return box(0, 0, 15, 16, 16, 16);
  if (side === 'west') return box(0, 0, 0, 1, 16, 16);
  return box(15, 0, 0, 16, 16, 16);
}

// Fence bars from the post out to one side.
function bars(side) {
  const reach = { north: [7, 0, 9, 6], south: [7, 10, 9, 16], west: [0, 7, 6, 9], east: [10, 7, 16, 9] }[side];
  const [xa, za, xb, zb] = reach;
  return [box(xa, 6, za, xb, 9, zb), box(xa, 12, za, xb, 15, zb)];
}

// The side opposite this one: a ladder facing north hangs on the wall to its south.
export const opposite = (side) => ({ north: 'south', south: 'north', west: 'east', east: 'west' })[side];

// Blocks that fill their whole space and hide what's behind them.
export function isFull(info) {
  return !!info && (!info.shape || info.shape === 'cube') && !info.see;
}

// The boxes for one block. block: { id, facing, part } from the build. info: the block's look (shape, see).
// joins(side): whether a fence reaches out that way (another fence, or a full block).
export function boxesOf(block, info, joins = () => false) {
  const shape = info?.shape || 'cube';
  const facing = block.facing || 'south';
  if (shape === 'slab') return block.half === 'top' ? [box(0, 8, 0, 16, 16, 16)] : [box(0, 0, 0, 16, 8, 16)];
  if (shape === 'carpet') return [box(0, 0, 0, 16, 1, 16)];
  if (shape === 'stairs') return [box(0, 0, 0, 16, 8, 16), half(facing, 8, 16)];
  if (shape === 'bed') return [box(0, 0, 0, 16, 9, 16)];
  if (shape === 'campfire') return [box(1, 0, 1, 15, 6, 15)];
  if (shape === 'ladder') return [plate(opposite(facing))];
  if (shape === 'fence') return [box(6, 0, 6, 10, 16, 10), ...Object.keys(SIDES).filter(joins).flatMap(bars)];
  if (shape === 'sprite') return [];
  return [box(0, 0, 0, 16, 16, 16)];
}

// A pillow on the head end of a bed: the end it faces.
export function pillowOf(block) {
  if (block.part !== 'head') return null;
  const side = block.facing || 'north';
  const at = { north: box(2, 9, 1, 14, 11, 6), south: box(2, 9, 10, 14, 11, 15), west: box(1, 9, 2, 6, 11, 14), east: box(10, 9, 2, 15, 11, 14) };
  return at[side];
}

// Shapes that also have a flat picture standing up: flowers, torches, and the flames of a campfire.
export const hasSprite = (info) => info?.shape === 'sprite' || info?.shape === 'campfire';
