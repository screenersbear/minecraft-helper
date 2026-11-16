// Thing list: small pictures with words next to them, two to a row.
// Used for what a recipe needs ("3 milk buckets"), what a mob drops, and where to find things.
import { el } from './el.js';
import { itemPicture } from './picture.js';
import { cellName, needsOf } from '../logic/say.js';
import { counted } from '../logic/plural.js';

// rows: [{ picture, text, note, href }]; href makes the words a link. heading: optional small label above the list.
export function thingList(rows, heading) {
  if (!rows.length) return null;
  return el(
    'section',
    { class: 'things' },
    heading ? el('h2', { class: 'small-label' }, heading) : null,
    el(
      'ul',
      { class: 'thing-list' },
      rows.map((r) => el('li', {}, r.picture, el('span', {}, r.href ? el('a', { class: 'mention', href: r.href }, r.text) : r.text, r.note ? el('small', {}, ` (${r.note})`) : null))),
    ),
  );
}

// What a recipe needs: "3 milk buckets", "3 wood planks (any kind)".
export function needsList(book, recipe) {
  const rows = needsOf(recipe).map(({ cell, count }) => ({
    picture: itemPicture(book, cell, 24),
    text: counted(count, cellName(cell, book)),
    note: book.items[cell]?.note,
  }));
  return thingList(rows);
}
