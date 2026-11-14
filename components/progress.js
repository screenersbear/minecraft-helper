// The progress bar of a guide or a builder trick: one bar for each step, filled in up to this one.
import { el } from './el.js';

export function progress(step, total) {
  const bars = Array.from({ length: total }, (_, i) => el('span', { class: i < step ? 'done' : '' }));
  return el('div', { class: 'progress', role: 'img', 'aria-label': `Step ${step} of ${total}` }, bars);
}
