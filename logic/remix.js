// Remix: the same build in other blocks, or the other way round. A remix: { wood, palette, flip }.
// wood swaps every wooden block for the same block in another wood (oak planks to spruce planks, oak stairs to spruce
// stairs). palette swaps the build's main blocks for a block palette's, most used first (see data/palettes.js), and
// stairs and slabs follow their block. flip turns it left to right. Only blocks the app can draw are swapped in:
// has(id) says whether it can.
import { PALETTES, paletteById } from '../data/palettes.js';
import { buildCounts } from './builds.js';

export const WOODS = [
  { id: 'oak', name: 'Oak' },
  { id: 'spruce', name: 'Spruce' },
  { id: 'birch', name: 'Birch' },
  { id: 'cherry', name: 'Cherry' },
  { id: 'dark_oak', name: 'Dark oak' },
  { id: 'acacia', name: 'Acacia' },
  { id: 'jungle', name: 'Jungle' },
];
const WOODEN = /^(oak|spruce|birch|cherry|dark_oak|acacia|jungle|mangrove|pale_oak)_(planks|log|stairs|slab|fence|fence_gate|trapdoor|door|button|pressure_plate)$/;
const SHAPED = ['_stairs', '_slab', '_fence_gate', '_fence'];
const FLIP = { east: 'west', west: 'east' };
// Plain blocks a build is made of, that a palette can swap.
const PLAIN = new Set(['cobblestone', 'mossy_cobblestone', 'stone', 'smooth_stone', 'sandstone', 'smooth_sandstone', 'red_sandstone', 'bricks', 'terracotta', 'snow_block', 'packed_ice', 'prismarine', 'dark_prismarine', 'quartz_block', 'moss_block', 'deepslate_bricks', 'calcite', 'tuff']);

export const isWooden = (id) => WOODEN.test(id);
export const isPlain = (id) => PLAIN.has(id) || /_(planks|log|wool|terracotta|concrete|bricks)$/.test(id);

// "spruce_stairs" in another wood: woodSwap('spruce_stairs', 'birch') -> 'birch_stairs'.
export function woodSwap(id, wood, has = () => true) {
  const m = WOODEN.exec(id);
  if (!m) return id;
  const out = `${wood}_${m[2]}`;
  return has(out) ? out : id;
}

// The plain block a shaped one is made of, and its shape: 'stone_brick_stairs' -> ['stone_bricks', '_stairs'].
export function shapeOf(id, has = () => true) {
  const end = SHAPED.find((e) => id.endsWith(e));
  if (!end) return null;
  const stem = id.slice(0, -end.length);
  const base = [`${stem}_planks`, `${stem}s`, stem, `${stem}_block`].find(has);
  return base ? [base, end] : null;
}

// The names a shaped block made of a plain one could have: ('stone_bricks', '_stairs') -> stone_bricks_stairs or
// stone_brick_stairs.
function shapedNames(base, end) {
  const stem = base.replace(/_planks$|_block$/, '');
  return [`${stem}${end}`, `${stem.replace(/s$/, '')}${end}`];
}

// The shaped block made of a plain one: shaped('cobblestone', '_stairs') -> 'cobblestone_stairs', or null.
export const shaped = (base, end, has = () => true) => shapedNames(base, end).find(has) || null;

// What each of the build's plain blocks becomes with a palette: { oak_planks: 'spruce_planks', ... }. Stairs and
// slabs count for the block they're made of. More kinds than the palette has go round its blocks again.
export function paletteSwaps(build, palette, has = () => true) {
  const targets = palette.blocks.filter((id) => isPlain(id) && has(id));
  const used = [];
  for (const { id } of buildCounts(build)) {
    const base = isPlain(id) ? id : shapeOf(id, has)?.[0];
    if (base && isPlain(base) && !used.includes(base)) used.push(base);
  }
  const swaps = {};
  if (targets.length) used.forEach((id, i) => (swaps[id] = targets[i % targets.length]));
  return swaps;
}

// One block id after the swaps, for plain and shaped blocks alike.
function swapWith(id, swaps, has) {
  if (swaps[id]) return swaps[id];
  const [base, end] = shapeOf(id, has) || [];
  return (base && swaps[base] && shaped(swaps[base], end, has)) || id;
}

// Whether a remix changes anything.
export const isRemixed = (remix) => !!remix && !!(remix.wood || remix.palette || remix.flip);

// A short name for a remix, for pictures and the label: "spruce, flipped".
export function remixName(remix) {
  const what = remix?.wood ? WOODS.find((w) => w.id === remix.wood)?.name : paletteById(remix?.palette)?.name;
  return [what, remix?.flip ? 'flipped' : ''].filter(Boolean).join(', ').toLowerCase();
}

// The build remixed. It keeps its id (so its pages stay the same); variant tells its pictures apart.
export function remixBuild(build, remix, has = () => true) {
  if (!isRemixed(remix)) return build;
  const palette = remix.palette ? paletteById(remix.palette) : null;
  const swaps = palette ? paletteSwaps(build, palette, has) : {};
  const swapId = (id) => (remix.wood ? woodSwap(id, remix.wood, has) : swapWith(id, swaps, has));
  const key = {};
  for (const [ch, entry] of Object.entries(build.key)) {
    const block = typeof entry === 'string' ? { id: entry } : { ...entry };
    if (!block.ground) block.id = swapId(block.id);
    if (remix.flip && FLIP[block.facing]) block.facing = FLIP[block.facing];
    key[ch] = Object.keys(block).length === 1 ? block.id : block;
  }
  const layers = remix.flip ? build.layers.map((l) => ({ ...l, rows: l.rows.map((r) => [...r].reverse().join('')) })) : build.layers;
  return { ...build, key, layers, variant: remixName(remix) };
}

// Every block a remix might need a picture for: each wood's blocks, and each palette's blocks with their stairs
// and slabs. The build tools add their looks.
export function remixIds() {
  const ends = ['planks', 'log', 'stairs', 'slab', 'fence', 'fence_gate', 'trapdoor'];
  const woods = WOODS.flatMap((w) => ends.map((e) => `${w.id}_${e}`));
  const palette = PALETTES.flatMap((p) => p.blocks).flatMap((id) => [id, ...shapedNames(id, '_stairs'), ...shapedNames(id, '_slab')]);
  return [...new Set([...woods, ...palette])];
}
