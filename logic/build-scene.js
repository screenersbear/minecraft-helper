// Turns a build into the faces to draw: the 3D picture shows the top, the front (the door side) and the right side
// of every box. Faces a full block hides are left out. looks: each block id's look from data/builds.json:
// { shape, top, side, front, sprite, pillow, see } where top, side, front, sprite and pillow are picture numbers.
import { allBlocks, blockAt, sizeOf } from './builds.js';
import { SIDES, boxesOf, pillowOf, isFull, hasSprite } from './build-shapes.js';

// Whether a fence at (x, y, z) reaches out to its side: towards another fence or a full block.
function joinsAt(build, looks, x, y, z) {
  return (side) => {
    const n = blockAt(build, x + SIDES[side].dx, y, z + SIDES[side].dz);
    const look = n && looks[n.id];
    return !!look && (look.shape === 'fence' || isFull(look));
  };
}

// Water's top sits a little low, unless more water is on top of it.
function lowered(boxes, block, above) {
  if (block.id !== 'water' || above?.id === 'water') return boxes;
  return boxes.map((b) => ({ ...b, y1: Math.min(b.y1, 14) }));
}

// Each face: { kind (top, front or right), c (where it is: its y, z or x), a0, a1, b0, b1 (how far it reaches the
// other two ways), bx, by, bz (the block's corner), tile, alpha, clear (see-through: glass and water) }.
// Sprites: { tile, x, y, z } (the centre of the bottom).
export function sceneOf(build, looks) {
  const faces = [];
  const sprites = [];
  for (const [x, y, z, block] of allBlocks(build)) {
    const look = looks[block.id] || {};
    const at = (dx, dy, dz) => blockAt(build, x + dx, y + dy, z + dz);
    // A face on the outside of the block is hidden by a full block next to it, or by more of the same see-through
    // block (glass next to glass, water next to water).
    const hiddenBy = (n) => !!n && (isFull(looks[n.id]) || (!!look.see && n.id === block.id));
    const bx = x * 16;
    const by = y * 16;
    const bz = z * 16;
    const alpha = block.id === 'water' ? 0.8 : 1;
    const facing = block.facing || 'south';
    const front = facing === 'south' && look.front !== undefined ? look.front : look.side;
    const right = facing === 'east' && look.front !== undefined ? look.front : look.side;
    const boxes = lowered(boxesOf(block, look, joinsAt(build, looks, x, y, z)), block, at(0, 1, 0));
    const pillow = look.shape === 'bed' ? pillowOf(block) : null;
    const parts = boxes.map((b) => ({ b, top: look.top, front, right }));
    if (pillow) parts.push({ b: pillow, top: look.pillow, front: look.pillow, right: look.pillow });
    for (const { b, top, front: f, right: r } of parts) {
      const base = { bx, by, bz, alpha, clear: !!look.see };
      if (!(b.y1 === 16 && hiddenBy(at(0, 1, 0)))) faces.push({ ...base, kind: 'top', c: by + b.y1, a0: bx + b.x0, a1: bx + b.x1, b0: bz + b.z0, b1: bz + b.z1, tile: top });
      if (!(b.z1 === 16 && hiddenBy(at(0, 0, 1)))) faces.push({ ...base, kind: 'front', c: bz + b.z1, a0: bx + b.x0, a1: bx + b.x1, b0: by + b.y0, b1: by + b.y1, tile: f });
      if (!(b.x1 === 16 && hiddenBy(at(1, 0, 0)))) faces.push({ ...base, kind: 'right', c: bx + b.x1, a0: bz + b.z0, a1: bz + b.z1, b0: by + b.y0, b1: by + b.y1, tile: r });
    }
    if (hasSprite(look)) sprites.push({ tile: look.sprite ?? look.top, x: bx + 8, y: by, z: bz + 8 });
  }
  return { ...sizeOf(build), faces, sprites };
}

// One square of the layer seen from above: what to draw in it, highest last. Each: { x0, z0, x1, z1 (pixels of the
// square, 0 to 16), y (how high its top is, 0 to 16), tile, whole (a flat picture filling the square), clear (glass
// or water) }.
export function topOf(build, looks, x, y, z) {
  const block = blockAt(build, x, y, z);
  if (!block) return [];
  const look = looks[block.id] || {};
  if (look.shape === 'sprite' || look.shape === 'ladder') return [{ x0: 0, z0: 0, x1: 16, z1: 16, y: 16, tile: look.sprite ?? look.top, whole: true }];
  const boxes = boxesOf(block, look, joinsAt(build, looks, x, y, z)).map((b) => ({ x0: b.x0, z0: b.z0, x1: b.x1, z1: b.z1, y: b.y1, tile: look.top }));
  const pillow = look.shape === 'bed' ? pillowOf(block) : null;
  if (pillow) boxes.push({ x0: pillow.x0, z0: pillow.z0, x1: pillow.x1, z1: pillow.z1, y: pillow.y1, tile: look.pillow });
  if (look.shape === 'campfire') boxes.push({ x0: 0, z0: 0, x1: 16, z1: 16, y: 16, tile: look.sprite, whole: true });
  return boxes.sort((a, b) => a.y - b.y).map((b) => (look.see ? { ...b, clear: true } : b));
}

// For an empty square: the nearest layer below with a block there (0-based), or -1.
export function belowAt(build, x, y, z) {
  for (let below = y - 1; below >= 0; below--) if (blockAt(build, x, below, z)) return below;
  return -1;
}
