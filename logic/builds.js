// Builds: things to make block by block, one layer at a time from the bottom up. A build: { id, name, difficulty
// (Easy, Medium or Big), group (Builds, Room ideas or Finish it), about, creative, key, layers, yourTurn }. Each layer has rows of
// letters from the back (the first row) to the front (the last row, the door side); key says which block each
// letter is, and '.' is air. A key entry is a block id, or { id, facing, part, half, ground } for blocks that point
// a way (facing: the side a stair's tall back is on, or a bed's head), half of a bed, a slab in the top half, or
// ground that's already there.
import { counted, listWords } from './plural.js';

export const DIFFICULTIES = ['Easy', 'Medium', 'Big'];
// How wide and deep each kind may be, at most.
export const MOST = { Easy: 7, Medium: 11, Big: 15 };

export function sizeOf(build) {
  const first = build.layers[0]?.rows || [];
  return { W: first[0]?.length || 0, H: build.layers.length, D: first.length };
}

// The block at x (left to right), y (layer, from 0 at the bottom), z (row, back to front), or null for air.
export function blockAt(build, x, y, z) {
  const ch = build.layers[y]?.rows[z]?.[x];
  const entry = ch && ch !== '.' ? build.key[ch] : null;
  if (!entry) return null;
  return typeof entry === 'string' ? { id: entry } : entry;
}

// Every block, as [x, y, z, block].
export function allBlocks(build) {
  const out = [];
  const { W, H, D } = sizeOf(build);
  for (let y = 0; y < H; y++) for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
    const b = blockAt(build, x, y, z);
    if (b) out.push([x, y, z, b]);
  }
  return out;
}

// A bed is two blocks but one item: only its foot counts. Ground ({ ground: true }, like the grass around a pond)
// is already there, so it isn't counted either.
const counts = (blocks) => {
  const map = new Map();
  for (const [, , , b] of blocks) if (b.part !== 'head' && !b.ground) map.set(b.id, (map.get(b.id) || 0) + 1);
  return [...map].map(([id, count]) => ({ id, count })).sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));
};

// What the whole build needs, most first: [{ id, count }].
export const buildCounts = (build) => counts(allBlocks(build));

// What one layer needs (n from 1 at the bottom).
export const layerCounts = (build, n) => counts(allBlocks(build).filter(([, y]) => y === n - 1));

export const totalOf = (list) => list.reduce((sum, c) => sum + c.count, 0);

// "42 birch planks", "1 oak log", "8 squares of water".
export function countWords(book, c) {
  if (c.id === 'water') return `${c.count} square${c.count === 1 ? '' : 's'} of water`;
  const name = (book.items[c.id]?.name || c.id.replace(/_/g, ' ')).toLowerCase();
  // One "bricks" is a block of them ("1 brick" would be the item you make them from).
  if (c.count === 1 && name.endsWith('bricks')) return `1 ${name} block`;
  return counted(c.count, name);
}

// The picture for a block in the lists: water shows as a water bucket.
export const pictureId = (id) => (id === 'water' ? 'water_bucket' : id);

// "Cat house. A little wooden house for your cat. It has 5 layers, and needs 42 birch planks, 34 spruce planks and 3
// more kinds of block."
export function coverSentence(book, build) {
  const list = buildCounts(build);
  const top = list.slice(0, 2).map((c) => countWords(book, c));
  const more = list.length - top.length;
  if (more > 0) top.push(`${more} more kind${more === 1 ? '' : 's'} of block`);
  const layers = build.layers.length;
  return `${build.name}. ${build.about} It has ${layers} layer${layers === 1 ? '' : 's'}, and needs ${listWords(top)}.`;
}

// "Layer 2 of 5: walls and door. Leave the middle open. You need 12 birch planks and 4 oak logs."
export function layerSentence(book, build, n) {
  const layer = build.layers[n - 1];
  const need = layerCounts(build, n).map((c) => countWords(book, c));
  const start = n === 1 ? 'Start at the bottom. ' : '';
  const tip = layer.tip ? ` ${layer.tip}` : '';
  return `${start}Layer ${n} of ${build.layers.length}: ${layer.name.toLowerCase()}.${tip} You need ${listWords(need)}.`;
}

// "5 layers · 5 by 5 blocks · 91 blocks"
export function sizeText(build) {
  const { W, H, D } = sizeOf(build);
  const total = totalOf(buildCounts(build));
  return `${H} layer${H === 1 ? '' : 's'} · ${W} by ${D} blocks · ${total} block${total === 1 ? '' : 's'}`;
}

// Builds of one kind ('All' for every one), in the order given.
export const filterBuilds = (builds, difficulty) => (difficulty === 'All' ? builds : builds.filter((b) => b.difficulty === difficulty));

export const findBuild = (builds, id) => builds.find((b) => b.id === id) || null;
