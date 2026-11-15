// Top bar: the big back button on the left, with an arrow and the name of where it goes ("‹ Guides", "‹ Ocean"),
// and the page's label on the right, right on the dirt. Every screen but the four main pages has one. Swiping in
// from the left edge of the screen does the same as tapping it (see components/edge-swipe.js).
import { el } from './el.js';
import { placeName } from '../logic/place-name.js';

// back: the address it goes to. name: what to call that place, when the address alone can't say (a pixel art's
// name); otherwise it comes from placeName. right: text. ctx: what the pages get, for the names.
export function topBar({ back, name, right }, ctx) {
  const where = name || placeName(back, ctx);
  const button = el(
    'a',
    { class: 'back-btn', href: back, 'aria-label': `Back to ${where}` },
    el('span', { class: 'back-arrow', 'aria-hidden': 'true' }, '‹'),
    el('span', { class: 'back-name' }, where),
  );
  return [el('header', { class: 'top-bar' }, button, el('span', { class: 'top-label' }, right || ''))];
}
