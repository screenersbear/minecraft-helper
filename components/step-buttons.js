// Step buttons: the row at the bottom of a step-by-step screen (a guide, a build's layers, a builder trick, a pixel
// art's rows). They only move between steps, and say so: "‹ Step", "Again", "Step ›". Only the big back button at
// the top leaves, so the two never get mixed up. On the last step, "‹ Step" and "Again" sit over a big Done button
// that goes back to where it was opened from. Done is under them, not where "Step ›" was, so a fast double tap on
// "Step ›" can't skip the last step.
import { el } from './el.js';
import { blockButton } from './buttons.js';

// n: this step (from 1). total: how many steps. actions: { back, again, next }. done: what Done does. doneLabel: its
// words, when not "Done" ("Your turn" for a build that ends with an idea of your own).
export function stepButtons({ n, total, actions, done, doneLabel = 'Done' }) {
  const before = blockButton({ label: '‹ Step', tone: 'grey', onClick: actions.back, extra: { 'aria-label': 'Step back', ...(n <= 1 ? { disabled: true } : {}) } });
  const again = blockButton({ label: 'Again', tone: 'grey', onClick: actions.again });
  if (n < total) {
    return el('div', { class: 'three-up' }, before, again, blockButton({ label: 'Step ›', tone: 'green', onClick: actions.next, extra: { 'aria-label': 'Next step' } }));
  }
  return el(
    'div',
    { class: 'last-step' },
    el('div', { class: 'two-up' }, before, again),
    blockButton({ label: doneLabel, tone: 'green', onClick: done, extra: { class: 'block-btn tone-green done-btn' } }),
  );
}
