// Block pictures for the builds and the builder tricks: cuts each picture a block needs from Pixel Perfection CE
// (or Mineclonia, for the few it doesn't have) once, and writes them all as one image, images/build-blocks.png (16
// by 16 pixels each, 16 to a row). Each block's look (its shape and which pictures go on its top, sides and front)
// comes from looks.mjs.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { PNG } from 'pngjs';
import { lookFor, TINTS } from './looks.mjs';

const app = fileURLToPath(new URL('../..', import.meta.url));
const TEX = join(app, '.cache/ppce/assets/minecraft/textures/block');
const MCL = join(app, '.cache/mineclonia/mods/ITEMS');
const COLUMNS = 16;

// Pictures Pixel Perfection CE doesn't have (cherry wood is newer than it), from Mineclonia instead.
const CHERRY = 'mcl_cherry_blossom/textures/mcl_cherry_blossom';
const MINECLONIA = {
  cherry_planks: `${CHERRY}_planks`,
  cherry_log: `${CHERRY}_log`,
  cherry_log_top: `${CHERRY}_log_top`,
  cherry_leaves: `${CHERRY}_leaves`,
  cherry_trapdoor: `${CHERRY}_trapdoor`,
  cherry_door_top: `${CHERRY}_door_top`,
  cherry_door_bottom: `${CHERRY}_door_bottom`,
  moss_block: 'mcl_lush_caves/textures/mcl_lush_caves_moss_block',
};
const fileOf = (name) => (MINECLONIA[name] ? join(MCL, `${MINECLONIA[name]}.png`) : join(TEX, `${name}.png`));

// The first 16 by 16 picture of a block (moving pictures, like water, are a strip of them), tinted if the game
// colours it in.
function picture(name) {
  const png = PNG.sync.read(readFileSync(fileOf(name)));
  const out = Buffer.alloc(16 * 16 * 4);
  const step = png.width / 16;
  const tint = TINTS[name];
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const i = (Math.floor(y * step) * png.width + Math.floor(x * step)) * 4;
    const o = (y * 16 + x) * 4;
    for (let k = 0; k < 4; k++) out[o + k] = png.data[i + k];
    if (tint) for (let k = 0; k < 3; k++) out[o + k] = (out[o + k] * ((tint >> (16 - k * 8)) & 255)) / 255;
  }
  return out;
}

// Pictures drawn over each other: the first at the bottom.
function layered(names, under = null) {
  const out = under ? Buffer.from(under) : Buffer.alloc(16 * 16 * 4);
  for (const name of names) {
    const top = picture(name);
    for (let i = 0; i < out.length; i += 4) {
      if (top[i + 3] < 128) continue;
      for (let k = 0; k < 4; k++) out[i + k] = top[i + k];
    }
  }
  return out;
}

// Leaves get a dark green behind their holes, so they read as a bush, not a net.
function leafy(name) {
  const tint = TINTS[name] ?? 0x48b518;
  const dark = Buffer.alloc(16 * 16 * 4);
  for (let i = 0; i < dark.length; i += 4) dark.set([((tint >> 16) & 255) * 0.45, ((tint >> 8) & 255) * 0.45, (tint & 255) * 0.45, 255], i);
  return layered([name], dark);
}

// Glass gets a faint pale blue between its edges, so a glass wall reads as glass, not as an empty frame.
function pane(name) {
  const out = picture(name);
  for (let i = 0; i < out.length; i += 4) if (out[i + 3] < 128) out.set([220, 236, 242, 45], i);
  return out;
}

export const has = (name) => existsSync(fileOf(name));
const tiles = [];
const tileOf = new Map();
function tile(spec, look) {
  const key = `${[].concat(spec).join('+')}${look.leaves ? ':leaves' : ''}${look.pane ? ':pane' : ''}`;
  if (!tileOf.has(key)) {
    tileOf.set(key, tiles.length);
    tiles.push(look.leaves ? leafy(spec) : look.pane ? pane(spec) : Array.isArray(spec) ? layered(spec) : picture(spec));
  }
  return tileOf.get(key);
}

// The look of every block used so far, by id: { shape, see, top, side, front, sprite, pillow } with picture numbers.
export const looks = {};
export const hasLook = (id) => !!lookFor(id, has);
export function addLook(id) {
  if (looks[id]) return;
  const look = lookFor(id, has);
  const out = {};
  if (look.shape) out.shape = look.shape;
  if (look.see) out.see = look.see;
  for (const face of ['top', 'side', 'front', 'sprite', 'pillow']) if (look[face]) out[face] = tile(look[face], look);
  looks[id] = out;
}

// Writes every picture cut so far into images/build-blocks.png. Returns how many there are.
export function writeAtlas() {
  const rows = Math.ceil(tiles.length / COLUMNS);
  const atlas = new PNG({ width: COLUMNS * 16, height: rows * 16 });
  tiles.forEach((t, i) => {
    for (let y = 0; y < 16; y++) t.copy(atlas.data, (((Math.floor(i / COLUMNS) * 16 + y) * COLUMNS * 16) + (i % COLUMNS) * 16) * 4, y * 64, y * 64 + 64);
  });
  writeFileSync(join(app, 'images/build-blocks.png'), PNG.sync.write(atlas));
  return tiles.length;
}
