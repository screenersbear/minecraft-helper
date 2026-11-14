// A kid's own changes to a pixel art: one square to another block, or one block swapped for another everywhere.
// Both are remembered (edits and swaps), so they stay when the colours or outline are changed later.
import { lookOf, toBlocks } from './pixel-convert.js';

const idsOf = (art) => art.cells.map((b) => art.blocks[b]);

// Square i becomes block id. Returns the changes to save: { blocks, cells, edits }.
export function editSquare(art, i, id) {
  const ids = idsOf(art);
  if (i < 0 || i >= ids.length) return {};
  ids[i] = id;
  return { ...toBlocks(ids), edits: { ...lookOf(art).edits, [i]: id } };
}

// Every `from` block becomes `to`. Earlier swaps and changed squares that ended up as `from` follow along.
// Returns the changes to save: { blocks, cells, swaps, edits }.
export function swapBlock(art, from, to) {
  const look = lookOf(art);
  const swaps = {};
  for (const [a, b] of Object.entries(look.swaps)) swaps[a] = b === from ? to : b;
  if (from !== to) swaps[from] = to;
  for (const [a, b] of Object.entries(swaps)) if (a === b) delete swaps[a];
  const edits = {};
  for (const [i, id] of Object.entries(look.edits)) edits[i] = id === from ? to : id;
  return { ...toBlocks(idsOf(art).map((id) => (id === from ? to : id))), swaps, edits };
}
