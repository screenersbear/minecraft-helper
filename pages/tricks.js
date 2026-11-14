// Builder tricks (#/tricks): little tricks that make any build look better (a roof from stairs, hidden lights...),
// each a big button with its picture, its name and what it shows. A button opens the trick at step 1.
import { el } from '../components/el.js';
import { topBar } from '../components/top-bar.js';
import { itemPicture } from '../components/picture.js';
import { toHash } from '../logic/routes.js';

export function tricksPage(ctx) {
  const row = (t) =>
    el(
      'a',
      { class: 'menu-btn', href: toHash({ page: 'trick', id: t.id, step: 1 }) },
      itemPicture(ctx.book, t.pic, 32),
      el('span', { class: 'menu-words' }, el('b', {}, t.name), el('small', {}, t.about)),
    );
  return {
    title: 'Builder tricks',
    nodes: [
      ...topBar({ left: { label: 'Make', href: '#/make' }, right: 'Builder tricks' }),
      el(
        'div',
        { class: 'page make tricks' },
        el('h1', { class: 'page-title', tabindex: '-1' }, 'Builder tricks'),
        el('p', { class: 'home-intro' }, 'Little tricks that make any build look better. Each one shows you how, step by step.'),
        el('div', { class: 'menu-list' }, (ctx.tricks || []).map(row)),
      ),
    ],
  };
}
