// Pattern: a small picture of something to build, like the Nether portal frame, drawn block by block.
// In a guide step, letters stand for blocks (the step's key), "." is open space and "-" is "any block or empty".
import { el } from './el.js';
import { itemPicture } from './picture.js';

// Bigger blocks for small builds, smaller ones so a 5 by 5 build still fits on an iPhone SE.
function blockSize(rows, cols) {
  const most = Math.max(rows, cols);
  if (most >= 5) return 32;
  if (most === 4) return 40;
  return 48;
}

function describe(step, book) {
  const names = Object.values(step.key).map((id) => (book.items[id]?.name || id).toLowerCase());
  return `A picture of what to build with ${names.join(', ')}, ${step.pattern[0].length} blocks wide and ${step.pattern.length} tall.`;
}

export function patternPicture(book, step) {
  const rows = step.pattern.length;
  const cols = step.pattern[0].length;
  const size = blockSize(rows, cols);
  const cells = step.pattern.join('').split('').map((ch) => {
    if (ch === '.') return el('span', { class: 'build-air' });
    if (ch === '-') return el('span', { class: 'build-any' });
    return itemPicture(book, step.key[ch], size);
  });
  return el(
    'div',
    { class: 'build', role: 'img', 'aria-label': describe(step, book), style: { '--cols': cols, '--block': `${size}px` } },
    cells,
  );
}

// The legend next to a pattern: each block's picture and name, plus "Can be empty" when the pattern has "-".
export function patternLegend(book, step) {
  const rows = Object.values(step.key).map((id) => el('li', {}, itemPicture(book, id, 24), book.items[id]?.name || id));
  if (step.pattern.some((r) => r.includes('-'))) rows.push(el('li', {}, el('span', { class: 'build-any small' }), 'Can be empty'));
  return rows;
}
