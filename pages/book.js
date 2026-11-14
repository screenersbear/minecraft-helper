// The book: one of the five home pages. Eight big tiles (Tools, Weapons, Food...); each opens a page of everything in it.
import { el } from '../components/el.js';
import { itemPicture, mobPicture } from '../components/picture.js';
import { CATEGORIES } from '../data/categories.js';

export function bookPanel(ctx) {
  const tile = (c) =>
    el(
      'a',
      { class: 'cat-tile', href: `#/book/${c.id}` },
      c.mob ? mobPicture(ctx.book, c.mob, 48) : itemPicture(ctx.book, c.pic, 48),
      el('span', {}, c.name),
    );
  const node = el(
    'div',
    { class: 'page home-page' },
    el('h1', { class: 'home-title', tabindex: '-1' }, 'The book'),
    el('p', { class: 'home-intro' }, 'Pick a page to look around. Tap anything to see how to make it.'),
    el('div', { class: 'cat-grid' }, CATEGORIES.map(tile)),
    el('p', { class: 'swipe-hint' }, 'Swipe for guides, or back to ask'),
  );
  return { node };
}
