// Join builds: reads every build in builds/ (one JSON file each) and the ready-made pixel art in
// builds/pixel-art.json, checks them (see logic/build-check.js), cuts the block pictures they use from Pixel
// Perfection CE into images/build-blocks.png, and writes data/builds.json for the app. Run by npm run build.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { PNG } from 'pngjs';
import { checkBuild } from '../logic/build-check.js';
import { DIFFICULTIES, buildCounts } from '../logic/builds.js';
import { lookFor, TINTS } from './builds/looks.mjs';

const app = fileURLToPath(new URL('..', import.meta.url));
const SOURCE = join(app, 'builds');
const TEX = join(app, '.cache/ppce/assets/minecraft/textures/block');
const COLUMNS = 16;
const book = JSON.parse(readFileSync(join(app, 'data/book.json'), 'utf8'));

// The first 16 by 16 picture of a block (moving pictures, like water, are a strip of them), tinted if the game
// colours it in.
function picture(name) {
  const png = PNG.sync.read(readFileSync(join(TEX, `${name}.png`)));
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

const has = (name) => existsSync(join(TEX, `${name}.png`));
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

const problems = [];
const looks = {};
const known = (id) => (id === 'water' || book.items[id]?.pic >= 0) && !!lookFor(id, has);
function lookOf(id) {
  if (looks[id]) return;
  const look = lookFor(id, has);
  const out = {};
  if (look.shape) out.shape = look.shape;
  if (look.see) out.see = look.see;
  for (const face of ['top', 'side', 'front', 'sprite', 'pillow']) if (look[face]) out[face] = tile(look[face], look);
  looks[id] = out;
}

const files = readdirSync(SOURCE).filter((f) => f.endsWith('.json') && f !== 'pixel-art.json');
const builds = [];
for (const file of files) {
  const build = { id: file.replace(/\.json$/, ''), ...JSON.parse(readFileSync(join(SOURCE, file), 'utf8')) };
  const found = checkBuild(build, known);
  if (found.length) {
    problems.push(...found.map((p) => `${file}: ${p}`));
    continue;
  }
  for (const entry of Object.values(build.key)) lookOf(typeof entry === 'string' ? entry : entry.id);
  // The picture for the build in lists (like "Asked before"): the block it uses most.
  build.pic = buildCounts(build).find((c) => c.id !== 'water')?.id;
  builds.push(build);
}
const rank = (b) => DIFFICULTIES.indexOf(b.difficulty);
builds.sort((a, b) => (a.group === b.group ? 0 : a.group === 'Builds' ? -1 : 1) || rank(a) - rank(b) || a.name.localeCompare(b.name));

// Ready-made pixel art: square pictures in the pixel art colours, as { id, name, size, blocks, cells }.
const palette = new Set(book.palette.map((p) => p.id));
const pixel = Object.entries(JSON.parse(readFileSync(join(SOURCE, 'pixel-art.json'), 'utf8'))).map(([id, art]) => {
  const size = art.rows.length;
  if (art.rows.some((r) => r.length !== size)) problems.push(`pixel-art.json: ${id} isn't ${size} by ${size}`);
  const blocks = [...new Set(Object.values(art.key))];
  for (const b of blocks) if (!palette.has(b)) problems.push(`pixel-art.json: ${id} uses ${b}, which isn't a pixel art colour`);
  const cells = art.rows.join('').split('').map((ch) => blocks.indexOf(art.key[ch]));
  if (cells.includes(-1)) problems.push(`pixel-art.json: ${id} uses a letter that isn't in its key`);
  return { id, name: art.name, size, blocks, cells };
});

if (problems.length) {
  console.error(`Builds have problems:\n  ${problems.join('\n  ')}`);
  process.exit(1);
}

const rows = Math.ceil(tiles.length / COLUMNS);
const atlas = new PNG({ width: COLUMNS * 16, height: rows * 16 });
tiles.forEach((t, i) => {
  for (let y = 0; y < 16; y++) t.copy(atlas.data, (((Math.floor(i / COLUMNS) * 16 + y) * COLUMNS * 16) + (i % COLUMNS) * 16) * 4, y * 64, y * 64 + 64);
});
writeFileSync(join(app, 'images/build-blocks.png'), PNG.sync.write(atlas));
writeFileSync(join(app, 'data/builds.json'), `${JSON.stringify({ blocks: looks, builds, pixel })}\n`);
console.log(`builds: ${builds.length} builds, ${pixel.length} pixel art pictures, ${tiles.length} block pictures`);
