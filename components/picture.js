// Picture: shows an item, block or mob from images/items.png (all pictures in one image, 16 by 16 each).
// Things without a picture yet get their first letters on a grey square instead.
import { el } from './el.js';

// index: the picture's place in items.png. size: CSS pixels (a multiple of 8 keeps pixels even on iPhone).
export function pictureAt(book, index, size, name = '') {
  if (index === undefined || index < 0) {
    const letters = name.split(/\s+/).slice(0, 2).map((w) => w[0] || '').join('').toUpperCase();
    return el('span', { class: 'pic pic-none', 'aria-hidden': 'true', style: { '--s': `${size}px` } }, letters);
  }
  const { columns, cell, width } = book.atlas;
  const scale = size / 16;
  const x = (index % columns) * cell + 1;
  const y = Math.floor(index / columns) * cell + 1;
  return el('span', {
    class: 'pic',
    'aria-hidden': 'true',
    style: {
      '--s': `${size}px`,
      'background-size': `${width * scale}px auto`,
      'background-position': `${-x * scale}px ${-y * scale}px`,
    },
  });
}

// An item by id. Choices like "coal|charcoal" show the first.
export function itemPicture(book, id, size) {
  const first = String(id).split('|')[0];
  const item = book.items[first];
  return pictureAt(book, item?.pic, size, item?.name || first);
}

export function mobPicture(book, id, size) {
  const mob = book.mobs[id];
  return pictureAt(book, mob?.pic, size, mob?.name || id);
}

// A picture for a search target: { type: 'item' | 'mob' | 'guide', id }.
export function targetPicture(book, guides, target, size) {
  if (target.type === 'mob') return mobPicture(book, target.id, size);
  if (target.type === 'guide') return itemPicture(book, guides.find((g) => g.id === target.id)?.picture || '', size);
  return itemPicture(book, target.id, size);
}

// A plain name for a search target, for buttons.
export function targetName(book, guides, target) {
  if (target.type === 'mob') return book.mobs[target.id]?.name || target.id;
  if (target.type === 'guide') return guides.find((g) => g.id === target.id)?.title || target.id;
  return book.items[target.id]?.name || target.id;
}
