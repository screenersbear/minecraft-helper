// Buttons: the big square game buttons with a black edge and a bevel.
import { el } from './el.js';
import { icon } from './icons.js';

// tone: 'green' (the next thing to do) or 'grey'. Give onClick for a button or href for a link.
export function blockButton({ label, tone = 'grey', onClick, href, extra = {} }) {
  const cls = `block-btn tone-${tone}`;
  if (href) return el('a', { class: cls, href, ...extra }, label);
  return el('button', { class: cls, type: 'button', onclick: onClick, ...extra }, label);
}

// A wide grey button with a picture: used for "Did you mean one of these?".
export function pickButton({ picture, label, onClick }) {
  return el('button', { class: 'pick-btn', type: 'button', onclick: onClick }, picture, el('span', {}, label));
}

// "Did that answer it?" with Yes! and Not really.
export function feedback({ onYes, onNo }) {
  return el(
    'section',
    { class: 'feedback', 'aria-label': 'Did that answer it?' },
    el('p', { class: 'feedback-q' }, 'Did that answer it?'),
    el('div', { class: 'two-up' }, blockButton({ label: 'Yes!', tone: 'green', onClick: onYes }), blockButton({ label: 'Not really', tone: 'grey', onClick: onNo })),
  );
}

// The dark square speaker button next to an answer's name: says the answer again.
export function speakerButton(onClick) {
  return el('button', { class: 'speaker-btn', type: 'button', 'aria-label': 'Say it again', onclick: onClick }, icon('speaker', 28));
}
