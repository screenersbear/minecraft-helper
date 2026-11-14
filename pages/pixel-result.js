// Pixel art, step 2 (#/pixel/<id>): the picture made of blocks, a switch back to the photo, a "Wool only" switch,
// and every block it needs, most first. Build it goes row by row.
import { el } from '../components/el.js';
import { topBar } from '../components/top-bar.js';
import { blockButton } from '../components/buttons.js';
import { blockArt } from '../components/block-art.js';
import { thingList } from '../components/thing-list.js';
import { itemPicture } from '../components/picture.js';
import { getArt, updateArt, removeArt } from '../data/pixel-store.js';
import { matchPixels } from '../logic/pixel.js';
import { blockCounts, countText } from '../logic/pixel-rows.js';
import { listWords } from '../logic/plural.js';
import { toHash } from '../logic/routes.js';

// "You need 140 white wool, 60 black wool and 3 more kinds of block."
function needSentence(book, counts) {
  const top = counts.slice(0, 2).map((c) => countText(book, c));
  const more = counts.length - top.length;
  if (more > 0) top.push(`${more} more kind${more === 1 ? '' : 's'} of block`);
  return `Here it is in blocks. You need ${listWords(top)}.`;
}

const toggle = (label, on, onClick) => el('button', { class: 'switch-btn', type: 'button', 'aria-pressed': String(on), onclick: onClick }, label);

export function pixelResultPage(ctx, route) {
  const art = getArt(route.id);
  if (!art) return null;
  const { book } = ctx;
  const counts = blockCounts(art);
  const say = needSentence(book, counts);
  const view = el('div', { class: 'art-view' });
  let showing = 'blocks';

  const show = (which) => {
    showing = which;
    view.replaceChildren(which === 'blocks' ? blockArt(book, art) : el('img', { class: 'art-photo', src: art.photo, alt: 'The photo' }));
    switches.querySelectorAll('button').forEach((b, i) => b.setAttribute('aria-pressed', String((i === 0) === (showing === 'blocks'))));
  };
  const switches = el('div', { class: 'switch-row' }, toggle('Blocks', true, () => show('blocks')), toggle('Photo', false, () => show('photo')));
  show('blocks');

  // Wool only: match the photo again using only wool, for when that's all you have.
  const wool = el('button', {
    class: 'switch-btn wool-btn',
    type: 'button',
    'aria-pressed': String(Boolean(art.woolOnly)),
    onclick: () => {
      const woolOnly = !art.woolOnly;
      updateArt(art.id, { woolOnly, ...matchPixels(art.rgb, book.palette, { woolOnly }) });
      ctx.refresh();
    },
  }, 'Wool only');

  const next = Math.min(art.row + 1, art.size);
  const remove = el('button', {
    class: 'text-btn',
    type: 'button',
    // Deletes saved pixel art for good, so automatic click tests skip it and it asks first.
    'data-test-skip': 'deletes saved pixel art',
    onclick: () => {
      if (!window.confirm(`Delete "${art.name}"? This can't be undone.`)) return;
      removeArt(art.id);
      ctx.go('#/make', { replace: true });
    },
  }, 'Delete it');

  const nodes = [
    ...topBar({ left: { label: 'Back', href: '#/make' }, right: 'Pixel art' }),
    el(
      'div',
      { class: 'page pixel-result' },
      el('h1', { class: 'answer-title', 'data-fit': '2', tabindex: '-1' }, art.name),
      el('p', { class: 'say' }, say),
      switches,
      view,
      el('div', { class: 'wool-row' }, wool, el('span', { class: 'small-label' }, 'For when wool is all you have')),
      thingList(counts.map((c) => ({ picture: itemPicture(book, c.id, 24), text: countText(book, c) })), 'Blocks you need, most first'),
      el(
        'div',
        { class: 'bottom' },
        el(
          'div',
          { class: 'two-up' },
          blockButton({ label: art.row > 0 && art.row < art.size ? 'Keep going' : 'Build it', tone: 'mango', href: toHash({ page: 'pixel', id: art.id, step: next }) }),
          blockButton({ label: 'Redo', tone: 'grey', href: '#/make' }),
        ),
        remove,
      ),
    ),
  ];
  return { nodes, say, title: art.name };
}
