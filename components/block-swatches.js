// Block swatches: a palette's blocks in a row, each a picture with its name under it.
import { el } from './el.js';
import { itemPicture } from './picture.js';

export function blockSwatches(book, ids) {
  return el(
    'ul',
    { class: 'swatches' },
    ids.map((id) => el('li', { class: 'swatch' }, el('span', { class: 'slot' }, itemPicture(book, id, 32)), el('span', {}, book.items[id]?.name || id))),
  );
}
