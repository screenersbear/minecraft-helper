// Top bar: a Back link on the left and the page's label on the right, right on the dirt.
import { el } from './el.js';

// left: { label, href } or { label, onClick } or plain text. right: text.
export function topBar({ left, right }) {
  let leftNode = el('span', {}, left || '');
  if (left && typeof left === 'object') {
    leftNode = left.href
      ? el('a', { class: 'top-link', href: left.href }, left.label)
      : el('button', { class: 'top-link', type: 'button', onclick: left.onClick }, left.label);
  }
  return [el('header', { class: 'top-bar' }, leftNode, el('span', {}, right || ''))];
}
