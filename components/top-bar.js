// Top bar: the dark ink band at the top with a Back link on the left and the page's label on the right,
// and the strip of grass under it.
import { el } from './el.js';

// left: { label, href } or { label, onClick } or plain text. right: text.
export function topBar({ left, right, grass = true }) {
  let leftNode = el('span', {}, left || '');
  if (left && typeof left === 'object') {
    leftNode = left.href
      ? el('a', { class: 'top-link', href: left.href }, left.label)
      : el('button', { class: 'top-link', type: 'button', onclick: left.onClick }, left.label);
  }
  const bar = el('header', { class: 'top-bar' }, leftNode, el('span', {}, right || ''));
  const strip = el('div', { class: grass ? 'grass' : 'stone-strip', 'aria-hidden': 'true' });
  return [bar, strip];
}
