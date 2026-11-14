// A page of the book (#/book/tools): everything in it as a grid of pictures. Tapping one opens its recipe, its facts,
// or the mob, and Back comes back here.
import { el } from '../components/el.js';
import { topBar } from '../components/top-bar.js';
import { itemPicture, mobPicture } from '../components/picture.js';
import { categoryById } from '../data/categories.js';
import { answerType } from '../logic/find-answer.js';
import { toHash } from '../logic/routes.js';

// Where tapping a thing goes: its recipe, its facts, or the mob's page.
function hashFor(ctx, target, from) {
  const type = answerType(target, ctx.book, ctx.guides);
  if (!type) return null;
  return toHash({ page: type === 'unpack' ? 'recipe' : type, id: target.id, from });
}

export function bookPage(ctx, route) {
  const { book } = ctx;
  const cat = categoryById(route.id);
  const ids = book.categories?.[route.id];
  if (!cat || !ids) return null;
  const isMobs = route.id === 'mobs';
  const from = `book/${route.id}`;
  // Mobs with a picture come first: they're easier to spot.
  const list = isMobs ? [...ids].sort((a, b) => (book.mobs[a].pic < 0) - (book.mobs[b].pic < 0)) : ids;
  const tiles = list.map((id) => {
    const target = { type: isMobs ? 'mob' : 'item', id };
    const href = hashFor(ctx, target, from);
    if (!href) return null;
    const name = isMobs ? book.mobs[id].name : book.items[id].name;
    const picture = isMobs ? mobPicture(book, id, 40) : itemPicture(book, id, 40);
    return el('a', { class: 'thing-tile', href }, el('span', { class: 'slot' }, picture), el('span', { class: 'thing-name' }, name));
  });
  const nodes = [
    ...topBar({ left: { label: 'Back', href: '#/book' }, right: 'The book' }),
    el(
      'div',
      { class: 'page book-page' },
      el('h1', { class: 'home-title', tabindex: '-1' }, cat.name),
      el('p', { class: 'home-intro' }, isMobs ? 'Tap a mob to see what it drops.' : 'Tap anything to see how to make it.'),
      el('div', { class: 'thing-grid' }, tiles),
    ),
  ];
  return { nodes, title: cat.name };
}
