// Guides: one of the four home pages. Every guide as a row with its picture, its name and how many steps it has.
import { el } from '../components/el.js';
import { itemPicture } from '../components/picture.js';
import { toHash } from '../logic/routes.js';

export function guidesPanel(ctx) {
  const row = (g) =>
    el(
      'a',
      { class: 'guide-row', href: toHash({ page: 'guide', id: g.id, step: 1, from: 'guides' }) },
      itemPicture(ctx.book, g.picture, 32),
      el('b', {}, g.title),
      el('span', {}, `${g.steps.length} steps`),
    );
  const node = el(
    'div',
    { class: 'page home-page' },
    el('h1', { class: 'home-title', tabindex: '-1' }, 'Guides'),
    el('p', { class: 'home-intro' }, 'Step by step. I read each step and wait for you.'),
    el('div', { class: 'guide-rows' }, ctx.guides.map(row)),
    el('p', { class: 'swipe-hint' }, 'Swipe back for the book'),
  );
  return { node };
}
