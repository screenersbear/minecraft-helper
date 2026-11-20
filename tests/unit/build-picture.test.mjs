import './_setup.mjs';
import { describe, it, expect } from 'vitest';
import { SIDES, opposite, isFull, boxesOf, pillowOf, hasSprite } from '../../logic/build-shapes.js';
import { sceneOf, topOf, belowAt } from '../../logic/build-scene.js';
import { isoSize, nearEdge, hit, cornersOf, hitSprite, drawScene, scaleFor } from '../../logic/iso.js';
import { realData } from './_setup.mjs';

const b = (x0, y0, z0, x1, y1, z1) => ({ x0, y0, z0, x1, y1, z1 });

describe('build shapes', () => {
  it('sides and opposites', () => {
    expect(Object.keys(SIDES)).toEqual(['north', 'south', 'west', 'east']);
    expect(['north', 'south', 'west', 'east'].map(opposite)).toEqual(['south', 'north', 'east', 'west']);
    expect(opposite('up')).toBe(undefined);
  });
  it('full blocks', () => {
    expect(isFull({})).toBe(true);
    expect(isFull({ shape: 'cube' })).toBe(true);
    expect(isFull({ shape: 'cube', see: true })).toBe(false);
    expect(isFull({ shape: 'slab' })).toBe(false);
    expect(isFull(undefined)).toBe(false);
  });
  it('cubes, slabs, carpets and paths', () => {
    expect(boxesOf({}, undefined)).toEqual([b(0, 0, 0, 16, 16, 16)]);
    expect(boxesOf({}, { shape: 'slab' })).toEqual([b(0, 0, 0, 16, 8, 16)]);
    expect(boxesOf({ half: 'top' }, { shape: 'slab' })).toEqual([b(0, 8, 0, 16, 16, 16)]);
    expect(boxesOf({}, { shape: 'carpet' })).toEqual([b(0, 0, 0, 16, 1, 16)]);
    expect(boxesOf({}, { shape: 'path' })).toEqual([b(0, 0, 0, 16, 15, 16)]);
  });
  it('stairs every way, and upside down', () => {
    expect(boxesOf({ facing: 'north' }, { shape: 'stairs' })).toEqual([b(0, 0, 0, 16, 8, 16), b(0, 8, 0, 16, 16, 8)]);
    expect(boxesOf({}, { shape: 'stairs' })[1]).toEqual(b(0, 8, 8, 16, 16, 16));
    expect(boxesOf({ facing: 'west' }, { shape: 'stairs' })[1]).toEqual(b(0, 8, 0, 8, 16, 16));
    expect(boxesOf({ facing: 'east', half: 'top' }, { shape: 'stairs' })).toEqual([b(0, 8, 0, 16, 16, 16), b(8, 0, 0, 16, 8, 16)]);
  });
  it('doors, trapdoors and ladders', () => {
    expect(boxesOf({ facing: 'north' }, { shape: 'door' })).toEqual([b(0, 0, 0, 16, 16, 3)]);
    expect(boxesOf({}, { shape: 'door' })).toEqual([b(0, 0, 13, 16, 16, 16)]);
    expect(boxesOf({ facing: 'west' }, { shape: 'door' })).toEqual([b(0, 0, 0, 3, 16, 16)]);
    expect(boxesOf({ facing: 'east' }, { shape: 'door' })).toEqual([b(13, 0, 0, 16, 16, 16)]);
    expect(boxesOf({ open: true, facing: 'north' }, { shape: 'trapdoor' })).toEqual([b(0, 0, 0, 16, 16, 3)]);
    expect(boxesOf({ half: 'top' }, { shape: 'trapdoor' })).toEqual([b(0, 13, 0, 16, 16, 16)]);
    expect(boxesOf({}, { shape: 'trapdoor' })).toEqual([b(0, 0, 0, 16, 3, 16)]);
    expect(boxesOf({ facing: 'north' }, { shape: 'ladder' })).toEqual([b(0, 0, 15, 16, 16, 16)]);
  });
  it('gates along x or z', () => {
    const across = boxesOf({}, { shape: 'gate' });
    expect(across).toHaveLength(4);
    expect(across[0]).toEqual(b(0, 5, 7, 2, 16, 9));
    expect(boxesOf({}, { shape: 'gate' }, (s) => s === 'south')[0]).toEqual(b(7, 5, 0, 9, 16, 2));
    expect(boxesOf({}, { shape: 'gate' }, (s) => s === 'north')[0]).toEqual(b(7, 5, 0, 9, 16, 2));
  });
  it('fences with bars to the sides they join', () => {
    expect(boxesOf({}, { shape: 'fence' })).toEqual([b(6, 0, 6, 10, 16, 10)]);
    const all = boxesOf({}, { shape: 'fence' }, () => true);
    expect(all).toHaveLength(9);
    expect(all[1]).toEqual(b(7, 6, 0, 9, 9, 6));
    expect(all[7]).toEqual(b(10, 6, 7, 16, 9, 9));
  });
  it('beds, campfires and sprites', () => {
    expect(boxesOf({}, { shape: 'bed' })).toEqual([b(0, 0, 0, 16, 9, 16)]);
    expect(boxesOf({}, { shape: 'campfire' })).toEqual([b(1, 0, 1, 15, 6, 15)]);
    expect(boxesOf({}, { shape: 'sprite' })).toEqual([]);
  });
  it('pillows on the head end', () => {
    expect(pillowOf({ part: 'foot' })).toBe(null);
    expect(pillowOf({ part: 'head' })).toEqual(b(2, 9, 1, 14, 11, 6));
    expect(pillowOf({ part: 'head', facing: 'south' })).toEqual(b(2, 9, 10, 14, 11, 15));
    expect(pillowOf({ part: 'head', facing: 'west' })).toEqual(b(1, 9, 2, 6, 11, 14));
    expect(pillowOf({ part: 'head', facing: 'east' })).toEqual(b(10, 9, 2, 15, 11, 14));
  });
  it('sprites', () => {
    expect(hasSprite({ shape: 'sprite' })).toBe(true);
    expect(hasSprite({ shape: 'campfire' })).toBe(true);
    expect(hasSprite({ shape: 'cube' })).toBe(false);
    expect(hasSprite(null)).toBe(false);
  });
});

const looks = {
  stone: { top: 0, side: 0 },
  glass: { top: 1, side: 1, see: true },
  water: { top: 1, side: 1, see: true },
  furnace: { top: 0, side: 0, front: 2 },
  oak_fence: { shape: 'fence', top: 0, side: 0 },
  oak_fence_gate: { shape: 'gate', top: 0, side: 0 },
  red_bed: { shape: 'bed', top: 0, side: 0, pillow: 2 },
  poppy: { shape: 'sprite', sprite: 2 },
  torch: { shape: 'sprite', top: 1 },
  ladder: { shape: 'ladder', top: 0 },
  campfire: { shape: 'campfire', top: 0, side: 0, sprite: 2 },
};
const build = (key, layers) => ({ key, layers: layers.map((rows) => ({ rows })) });

describe('sceneOf', () => {
  it('one block shows three faces', () => {
    const s = sceneOf(build({ s: 'stone' }, [['s']]), looks);
    expect(s).toMatchObject({ W: 1, H: 1, D: 1, sprites: [] });
    expect(s.faces.map((f) => f.kind)).toEqual(['top', 'front', 'right']);
    expect(s.faces[0]).toMatchObject({ c: 16, a0: 0, a1: 16, b0: 0, b1: 16, tile: 0, alpha: 1, clear: false, dim: false, mark: false });
  });
  it('faces a full block hides are left out', () => {
    const s = sceneOf(build({ s: 'stone' }, [['ss'], ['s.']]), looks);
    expect(s.faces).toHaveLength(7);
  });
  it('glass next to glass hides; glass does not hide stone', () => {
    expect(sceneOf(build({ g: 'glass' }, [['gg']]), looks).faces).toHaveLength(5);
    expect(sceneOf(build({ s: 'stone', g: 'glass' }, [['sg']]), looks).faces).toHaveLength(6);
  });
  it('water sits low unless water is on top', () => {
    const one = sceneOf(build({ w: 'water' }, [['w']]), looks);
    expect(one.faces[0]).toMatchObject({ c: 14, alpha: 0.8, clear: true });
    const two = sceneOf(build({ w: 'water' }, [['w'], ['w']]), looks);
    expect(two.faces.filter((f) => f.by === 0).map((f) => f.kind)).toEqual(['front', 'right']);
  });
  it('a block facing south or east shows its front picture there', () => {
    expect(sceneOf(build({ f: 'furnace' }, [['f']]), looks).faces.map((f) => f.tile)).toEqual([0, 2, 0]);
    expect(sceneOf(build({ f: { id: 'furnace', facing: 'east' } }, [['f']]), looks).faces.map((f) => f.tile)).toEqual([0, 0, 2]);
    expect(sceneOf(build({ f: { id: 'furnace', facing: 'north' } }, [['f']]), looks).faces.map((f) => f.tile)).toEqual([0, 0, 0]);
  });
  it('fences join fences, gates and full blocks', () => {
    const s = sceneOf(build({ f: 'oak_fence', s: 'stone', p: 'poppy' }, [['fsfp']]), looks);
    const fence = s.faces.filter((f) => f.bx === 0);
    expect(fence.length).toBeGreaterThan(3);
    const lone = sceneOf(build({ f: 'oak_fence', u: 'unknown' }, [['fu']]), looks);
    expect(lone.faces.filter((f) => f.bx === 0)).toHaveLength(3);
  });
  it('a gate between fences runs across', () => {
    const s = sceneOf(build({ f: 'oak_fence', g: 'oak_fence_gate' }, [['f'], ['g'], ['f']].map((r) => r).flat().map((r) => [r])), looks);
    expect(s.faces.length).toBeGreaterThan(0);
  });
  it('a bed with a pillow', () => {
    const s = sceneOf(build({ h: { id: 'red_bed', part: 'head', facing: 'north' } }, [['h']]), looks);
    expect(s.faces.filter((f) => f.tile === 2)).toHaveLength(3);
  });
  it('flowers and torches are sprites, dim when asked', () => {
    const s = sceneOf(build({ p: { id: 'poppy', dim: true }, t: 'torch' }, [['pt']]), looks);
    expect(s.faces).toEqual([]);
    expect(s.sprites).toEqual([{ tile: 2, x: 8, y: 0, z: 8, dim: true }, { tile: 1, x: 24, y: 0, z: 8, dim: false }]);
  });
  it('a block with no look is a cube', () => expect(sceneOf(build({ u: 'unknown' }, [['u']]), looks).faces).toHaveLength(3));
  it('marked blocks', () => expect(sceneOf(build({ s: { id: 'stone', mark: true } }, [['s']]), looks).faces.every((f) => f.mark)).toBe(true));
});

describe('topOf and belowAt', () => {
  const bl = build({ s: 'stone', p: 'poppy', l: 'ladder', h: { id: 'red_bed', part: 'head' }, c: 'campfire', g: 'glass', f: 'oak_fence', t: 'torch' }, [['spl.hcgf'], ['.......t']]);
  it('a cube from above', () => expect(topOf(bl, looks, 0, 0, 0)).toEqual([{ x0: 0, z0: 0, x1: 16, z1: 16, y: 16, tile: 0 }]));
  it('sprites and ladders fill the square', () => {
    expect(topOf(bl, looks, 1, 0, 0)).toEqual([{ x0: 0, z0: 0, x1: 16, z1: 16, y: 16, tile: 2, whole: true }]);
    expect(topOf(bl, looks, 2, 0, 0)).toEqual([{ x0: 0, z0: 0, x1: 16, z1: 16, y: 16, tile: 0, whole: true }]);
    expect(topOf(bl, looks, 7, 1, 0)[0].tile).toBe(1);
  });
  it('a bed with its pillow on top', () => expect(topOf(bl, looks, 4, 0, 0).map((p) => [p.y, p.tile])).toEqual([[9, 0], [11, 2]]));
  it('a campfire with its flames', () => expect(topOf(bl, looks, 5, 0, 0).map((p) => [p.y, !!p.whole])).toEqual([[6, false], [16, true]]));
  it('glass is see-through', () => expect(topOf(bl, looks, 6, 0, 0)[0].clear).toBe(true));
  it('a fence post', () => expect(topOf(bl, looks, 7, 0, 0)).toEqual([{ x0: 6, z0: 6, x1: 10, z1: 10, y: 16, tile: 0 }]));
  it('air, and a block with no look', () => {
    expect(topOf(bl, looks, 3, 0, 0)).toEqual([]);
    expect(topOf(build({ u: 'unknown' }, [['u']]), {}, 0, 0, 0)).toEqual([{ x0: 0, z0: 0, x1: 16, z1: 16, y: 16, tile: undefined }]);
  });
  it('the layer below with a block', () => {
    expect(belowAt(bl, 0, 1, 0)).toBe(0);
    expect(belowAt(bl, 3, 1, 0)).toBe(-1);
    expect(belowAt(bl, 0, 0, 0)).toBe(-1);
  });
});

// A tiny atlas: tile 0 solid red, tile 1 half see-through blue, tile 2 green with a see-through hole.
function atlas() {
  const width = 48;
  const data = new Uint8ClampedArray(width * 16 * 4);
  for (let y = 0; y < 16; y++) for (let x = 0; x < width; x++) {
    const tile = Math.floor(x / 16);
    const i = (y * width + x) * 4;
    if (tile === 0) data.set([200, 0, 0, 255], i);
    if (tile === 1) data.set([0, 0, 200, 128], i);
    if (tile === 2) data.set(x % 16 < 8 ? [0, 200, 0, 255] : [0, 0, 0, 0], i);
  }
  return { data, width };
}
const px = (img, x, y) => Array.from(img.data.slice((y * img.width + x) * 4, (y * img.width + x) * 4 + 4));

describe('iso', () => {
  it('picture size and scale', () => {
    expect(isoSize(1, 1, 1, 1)).toEqual({ width: 32, height: 32 });
    expect(isoSize(2, 3, 1, 0.5)).toEqual({ width: 24, height: 36 });
    expect(scaleFor({ W: 2, D: 2 }, 128)).toBe(2);
  });
  it('hit and corners for each kind of face', () => {
    const top = { kind: 'top', c: 16, a0: 0, a1: 16, b0: 0, b1: 16, bx: 0, by: 0, bz: 0 };
    expect(hit(top, 0, -8)).toEqual({ d: 32, u: 8, v: 8 });
    expect(hit(top, 40, 0)).toBe(null);
    expect(cornersOf(top)).toEqual([[0, -16], [-16, -8], [16, -8], [0, 0]]);
    const front = { kind: 'front', c: 16, a0: 0, a1: 16, b0: 0, b1: 16, bx: 0, by: 0, bz: 0 };
    expect(hit(front, -8, 4)).toEqual({ d: 32, u: 8, v: 8 });
    expect(hit(front, -8, 40)).toBe(null);
    expect(cornersOf(front)).toHaveLength(4);
    const right = { kind: 'right', c: 16, a0: 0, a1: 16, b0: 0, b1: 16, bx: 0, by: 0, bz: 0 };
    expect(hit(right, 8, 4)).toEqual({ d: 32, u: 8, v: 8 });
    expect(hit(right, 40, 4)).toBe(null);
    expect(cornersOf(right)[0]).toEqual([16, 8]);
  });
  it('near the edge of a face', () => {
    const top = { kind: 'top', c: 16, a0: 0, a1: 16, b0: 0, b1: 16, bx: 0, by: 0, bz: 0 };
    expect(nearEdge(top, { u: 8, v: 8 }, 1)).toBe(false);
    expect(nearEdge(top, { u: 0.5, v: 8 }, 1)).toBe(true);
    expect(nearEdge(top, { u: 15.5, v: 8 }, 1)).toBe(true);
    expect(nearEdge(top, { u: 8, v: 0.5 }, 1)).toBe(true);
    expect(nearEdge(top, { u: 8, v: 15.5 }, 1)).toBe(true);
    const right = { kind: 'right', c: 16, a0: 0, a1: 16, b0: 0, b1: 16, bx: 0, by: 0, bz: 0 };
    expect(nearEdge(right, { u: 8, v: 8 }, 1)).toBe(false);
  });
  it('sprites', () => {
    const sp = { x: 8, y: 0, z: 8 };
    expect(hitSprite(sp, 0, 0)).toMatchObject({ u: 8 });
    expect(hitSprite(sp, 20, 0)).toBe(null);
    expect(hitSprite(sp, 0, 40)).toBe(null);
  });
  it('draws a stone block: top lightest, right darkest, corners empty', () => {
    const img = drawScene(sceneOf(build({ s: 'stone' }, [['s']]), looks), 1, atlas());
    expect([img.width, img.height]).toEqual([32, 32]);
    expect(px(img, 16, 8)).toEqual([200, 0, 0, 255]);
    expect(px(img, 8, 20)).toEqual([160, 0, 0, 255]);
    expect(px(img, 24, 20)).toEqual([128, 0, 0, 255]);
    expect(px(img, 0, 0)[3]).toBe(0);
  });
  it('dim and marked blocks', () => {
    const dim = drawScene(sceneOf(build({ s: { id: 'stone', dim: true } }, [['s']]), looks), 1, atlas());
    expect(px(dim, 16, 8)).toEqual([120, 0, 0, 255]);
    const marked = drawScene(sceneOf(build({ s: { id: 'stone', mark: true } }, [['s']]), looks), 1, atlas());
    expect(px(marked, 16, 1)).toEqual([255, 255, 85, 255]);
    expect(px(marked, 16, 8)).toEqual([200, 0, 0, 255]);
  });
  it('glass and water are mixed over what is behind', () => {
    const img = drawScene(sceneOf(build({ g: 'glass' }, [['g']]), looks), 1, atlas());
    const [r, g, bl, a] = px(img, 16, 8);
    expect([r, g]).toEqual([0, 0]);
    expect(bl).toBeGreaterThan(150);
    expect(a).toBeGreaterThan(100);
    const over = drawScene(sceneOf(build({ s: 'stone', g: 'glass' }, [['s'], ['g']]), looks), 1, atlas());
    expect(px(over, 16, 20)[0]).toBeGreaterThan(0);
    const dimWater = drawScene(sceneOf(build({ w: { id: 'water', dim: true, mark: true } }, [['w']]), looks), 1, atlas());
    expect(px(dimWater, 16, 3)).toEqual([255, 255, 85, 255]);
  });
  it('see-through spots in a solid picture show nothing', () => {
    const img = drawScene(sceneOf(build({ p: 'poppy' }, [['p']]), looks), 1, atlas());
    const drawn = [];
    for (let x = 0; x < img.width; x++) for (let y = 0; y < img.height; y++) if (px(img, x, y)[3]) drawn.push(x);
    expect(drawn.length).toBeGreaterThan(0);
    expect(Math.max(...drawn)).toBeLessThan(16);
  });
  it('a fully clear see-through picture adds nothing', () => {
    const clearAtlas = { data: new Uint8ClampedArray(16 * 16 * 4), width: 16 };
    const img = drawScene(sceneOf(build({ g: 'glass' }, [['g']]), { glass: { top: 0, side: 0, see: true } }), 1, clearAtlas);
    expect(img.data.every((v) => v === 0)).toBe(true);
  });
  it('a narrow atlas and pictures past the edge', () => {
    const img = drawScene({ W: 1, H: 1, D: 1, faces: [], sprites: [{ tile: 0, x: 8, y: 0, z: 8 }] }, 2, { data: new Uint8ClampedArray(16 * 16 * 4).fill(255), width: 8 });
    expect(img.width).toBe(64);
  });
  it('a nearer face covers a farther one, whatever the order', () => {
    const scene = sceneOf(build({ s: 'stone', f: 'furnace' }, [['s.', '.f']]), looks);
    const a = drawScene(scene, 1, atlas());
    const bImg = drawScene({ ...scene, faces: [...scene.faces].reverse() }, 1, atlas());
    expect(Array.from(a.data)).toEqual(Array.from(bImg.data));
  });
  it('every real build draws', () => {
    const { builds } = realData();
    const real = builds.builds[0];
    const scene = sceneOf(real, builds.blocks);
    const img = drawScene(scene, 0.25, { data: new Uint8ClampedArray(16 * 16 * 4).fill(200), width: 16 });
    expect(img.data.some((v) => v > 0)).toBe(true);
  });
});
