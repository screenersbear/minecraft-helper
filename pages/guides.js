// Guides: the last of the four home pages. Big chapter tiles in two columns (Getting started, Finding things,
// Animals...), each with a picture in a slot, its name and three examples of what's inside. A tile opens the chapter.
import { el } from '../components/el.js';
import { itemPicture } from '../components/picture.js';
import { CHAPTERS } from '../data/chapters.js';
import { chapterGuides, chapterTopics } from '../logic/chapters.js';

export function guidesPanel(ctx) {
  // Only chapters with something in them: a guide, or a topic from an add-on.
  const full = CHAPTERS.filter((c) => chapterGuides(ctx.guides, c).length || chapterTopics(ctx.addons, c).length);
  const tile = (c) =>
    el(
      'a',
      { class: 'chapter-tile panel-box', href: `#/guides/${c.id}` },
      el('span', { class: 'slot' }, itemPicture(ctx.book, c.pic, 32)),
      el('span', { class: 'chapter-words' }, el('b', {}, c.name), el('small', {}, c.about)),
    );
  const node = el(
    'div',
    { class: 'page home-page' },
    el('h1', { class: 'home-title', tabindex: '-1' }, 'Guides'),
    el('p', { class: 'home-intro' }, 'Pick a chapter. I read each step and wait for you.'),
    el('div', { class: 'chapter-grid' }, full.map(tile)),
    el('p', { class: 'swipe-hint' }, 'Swipe back for the book'),
  );
  return { node };
}
