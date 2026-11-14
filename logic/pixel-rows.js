// Pixel art rows: what to place, row by row from the bottom, left to right, and how many of each block in all.
import { listWords } from './plural.js';

// Row 1 is the bottom row. Returns its squares left to right as block numbers.
export function rowCells(art, row) {
  const top = art.size - row;
  return art.cells.slice(top * art.size, (top + 1) * art.size);
}

// "3 white, 2 orange, 3 white" as [{ block, count }], left to right.
export function rowRuns(art, row) {
  const runs = [];
  for (const b of rowCells(art, row)) {
    const last = runs[runs.length - 1];
    if (last && last.block === b) last.count += 1;
    else runs.push({ block: b, count: 1 });
  }
  return runs.map((r) => ({ id: art.blocks[r.block], count: r.count }));
}

// Every block the picture needs, most first: [{ id, count }].
export function blockCounts(art) {
  const counts = new Map();
  for (const b of art.cells) counts.set(b, (counts.get(b) || 0) + 1);
  return [...counts]
    .map(([b, count]) => ({ id: art.blocks[b], count }))
    .sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));
}

// "white wool" from the book's name ("White Wool").
const blockName = (book, id) => (book.items[id]?.name || id.replace(/_/g, ' ')).toLowerCase();

// "Row 1: 3 white wool, 2 orange wool and 3 white wool." The first row says where to start.
export function rowSentence(book, art, row) {
  const parts = rowRuns(art, row).map((r) => `${r.count} ${blockName(book, r.id)}`);
  const start = row === 1 ? 'Start at the bottom, on the left. ' : '';
  return `${start}Row ${row}: ${listWords(parts)}.`;
}

// "37 white wool, 12 black concrete": for the shopping list.
export const countText = (book, c) => `${c.count} ${blockName(book, c.id)}`;
