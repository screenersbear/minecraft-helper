// Want to know more?: two or three big buttons under an answer, each leading one step deeper. Each remembers the
// answer it was tapped on (the trail), so the next page shows the way back. A button whose answer is missing still
// shows: tapping it saves the question for the grown-ups list, then the page says "I don't know that yet".
import { el } from './el.js';
import { blockButton } from './buttons.js';
import { logQuestion } from '../data/questions-log.js';
import { deeperHash } from '../logic/routes.js';

// items: [{ label, hash, missing }]. missing: what the grown-ups list says ("Missing (The Bloop): ..."), or nothing.
// here: the address of the answer on screen.
export function digDeeper(items, here = location.hash) {
  if (!items.length) return null;
  const button = (item) => {
    const link = blockButton({ label: item.label, tone: 'grey', href: deeperHash(item.hash, here), extra: { class: 'block-btn notch tone-grey dig-btn' } });
    if (item.missing) link.addEventListener('click', () => logQuestion({ q: item.label, answer: item.missing, reason: 'missing', missing: item.missing }));
    return link;
  };
  return el('section', { class: 'dig-deeper', 'aria-label': 'Want to know more?' }, el('h2', { class: 'small-label' }, 'Want to know more?'), items.map(button));
}
