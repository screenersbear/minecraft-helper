// How big?: the pixel art sizes (8 to 32 blocks across) as buttons, each with how many blocks it takes, and a note
// under them. The page picks the starting size; a tap changes it.
import { el } from './el.js';
import { SIZES } from '../logic/pixel-size.js';

const blockCount = (n) => (n * n).toLocaleString('en-US');

// The note under the sizes. round: the thing is round. picked: the kid chose the size (not the app).
export function sizeNote(size, round, picked) {
  if (round && size < 24) return 'Round things come out in steps. 24 or 32 makes the curve smoother.';
  if (size === 32) return 'Big ones are easiest in Creative mode.';
  return picked ? 'Tap another size to change it.' : 'This size fits it best. Tap another to change it.';
}

// onPick(size): a size was tapped. Returns { node, show(size, note) } to mark a size and change the note.
export function sizePicker(onPick) {
  const note = el('p', { class: 'small-label size-note', role: 'status' });
  const buttons = SIZES.map((n) =>
    el(
      'button',
      { class: 'size-btn notch', type: 'button', 'aria-pressed': 'false', 'aria-label': `${n} by ${n}, ${blockCount(n)} blocks`, onclick: () => onPick(n) },
      el('b', {}, String(n)),
      el('span', {}, blockCount(n)),
    ),
  );
  const show = (size, text) => {
    buttons.forEach((b, i) => b.setAttribute('aria-pressed', String(SIZES[i] === size)));
    note.textContent = text;
  };
  const node = el('section', { class: 'make-sizes' }, el('h2', { class: 'small-label' }, 'How big? Blocks across, and blocks in all'), el('div', { class: 'size-row' }, buttons), note);
  return { node, show };
}
