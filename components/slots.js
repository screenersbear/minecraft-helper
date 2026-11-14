// Slots: the grey inventory boxes from the game, for showing a recipe. A crafting grid, a furnace,
// a stonecutter or a smithing table on the left, an arrow, and what you make on the right.
// With linkFor, each thing it needs is a link to how to get that thing (tap the sugar in a cake recipe).
import { el } from './el.js';
import { icon } from './icons.js';
import { itemPicture } from './picture.js';
import { cellName, fitsInInventory } from '../logic/say.js';

const PIC = 40; // picture size inside a slot
const BIG = 56; // picture size in the result slot

// linkFor(cell): the address of that thing's answer, or '' if there isn't one.
function slot(book, cell, linkFor) {
  const href = cell && linkFor ? linkFor(cell) : '';
  if (href) return el('a', { class: 'slot slot-link', href, 'aria-label': `${cellName(cell, book)}: how to get it` }, itemPicture(book, cell, PIC));
  return el('div', { class: 'slot' }, cell ? itemPicture(book, cell, PIC) : null);
}

// A panel is one picture for screen readers, unless its slots are links: then each link is read out.
const panelRole = (linkFor) => (linkFor ? 'group' : 'img');

// The crafting grid: 2 by 2 when it fits in your inventory, otherwise the 3 by 3 crafting table.
// Shaped recipes sit in the top left corner; shapeless ones fill the grid in reading order.
function craftingCells(recipe) {
  const size = fitsInInventory(recipe) ? 2 : 3;
  const cells = Array(size * size).fill('');
  if (recipe.shapeless) {
    recipe.grid.flat().filter(Boolean).forEach((c, i) => (cells[i] = c));
  } else {
    recipe.grid.forEach((row, r) => row.forEach((c, col) => (cells[r * size + col] = c || '')));
  }
  return { size, cells };
}

const ROWS = { 2: ['Top row', 'Bottom row'], 3: ['Top row', 'Middle row', 'Bottom row'] };

function gridLabel(book, size, cells) {
  const rows = [];
  for (let r = 0; r < size; r++) {
    const names = cells.slice(r * size, r * size + size).map((c) => (c ? cellName(c, book) : 'empty'));
    rows.push(`${ROWS[size][r]}: ${names.join(', ')}`);
  }
  return `Crafting grid. ${rows.join('. ')}.`;
}

function craftingPanel(book, recipe, linkFor) {
  const { size, cells } = craftingCells(recipe);
  return el(
    'div',
    { class: `panel grid-${size}`, role: panelRole(linkFor), 'aria-label': gridLabel(book, size, cells) },
    cells.map((c) => slot(book, c, linkFor)),
  );
}

function furnacePanel(book, recipe, linkFor) {
  return el(
    'div',
    { class: 'panel furnace', role: panelRole(linkFor), 'aria-label': `Furnace: ${cellName(recipe.input, book)} on top, fuel below` },
    slot(book, recipe.input, linkFor),
    el('span', { class: 'flame' }, icon('flame', 28)),
    el('div', { class: 'slot fuel' }, itemPicture(book, 'coal', PIC)),
  );
}

function stonecutterPanel(book, recipe, linkFor) {
  return el('div', { class: 'panel', role: panelRole(linkFor), 'aria-label': `Stonecutter: ${cellName(recipe.input, book)}` }, slot(book, recipe.input, linkFor));
}

function smithingPanel(book, recipe, linkFor) {
  const label = `Smithing table: ${recipe.slots.map((c) => cellName(c, book)).join(', ')}`;
  return el('div', { class: 'panel grid-row', role: panelRole(linkFor), 'aria-label': label }, recipe.slots.map((c) => slot(book, c, linkFor)));
}

const PANELS = { crafting: craftingPanel, furnace: furnacePanel, stonecutter: stonecutterPanel, smithing: smithingPanel };

// The whole row: where it's made, the arrow, and the result with how many you get.
export function recipeView(book, recipe, id, linkFor) {
  const made = book.items[id]?.name || id;
  const result = el(
    'div',
    { class: 'panel' },
    el(
      'div',
      { class: 'slot result', role: 'img', 'aria-label': recipe.count > 1 ? `Makes ${recipe.count} ${made}` : `Makes ${made}` },
      itemPicture(book, id, BIG),
      recipe.count > 1 ? el('span', { class: 'count' }, String(recipe.count)) : null,
    ),
  );
  return el('div', { class: `recipe-row how-${recipe.how}` }, PANELS[recipe.how](book, recipe, linkFor), el('span', { class: 'arrow' }, icon('arrow', 28)), result);
}
