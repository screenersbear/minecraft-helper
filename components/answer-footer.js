// Answer footer: the bottom of every answer. "Did that answer it?" (see feedback-area.js), then the small talk
// button to ask more. Pages call stop() when they close, so it stops listening.
import { el } from './el.js';
import { feedbackArea } from './feedback-area.js';
import { askMore } from './ask-more.js';

// feedback: the options for feedbackArea, or false for none (the "not in the book" screens).
// talk: options for the talk button (see ask-more.js).
export function answerFooter(ctx, { feedback, talk } = {}) {
  const asked = feedback ? feedbackArea(ctx, feedback) : null;
  const more = askMore(ctx, talk);
  return { node: el('div', { class: 'bottom' }, asked?.node, more.node), stop: more.stop, feedback: asked };
}
