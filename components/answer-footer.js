// Answer footer: the bottom of every answer. "Want to know more?" buttons (see follow-chips.js), "Did that answer it?" (see
// feedback-area.js), then the small talk button to ask more. Pages call stop() when they close, so it stops
// listening, and hand memory to the app, so a follow-up knows the topic.
import { el } from './el.js';
import { feedbackArea } from './feedback-area.js';
import { askMore } from './ask-more.js';
import { followChips } from './follow-chips.js';

// feedback: the options for feedbackArea, or false for none (the "not in the book" screens).
// talk: options for the talk button (see ask-more.js). follow: what the answer is about, for the buttons and
// topic memory: { topic, text, here } (see follow-chips.js).
export function answerFooter(ctx, { feedback, talk, follow } = {}) {
  const chips = follow ? followChips(ctx, follow) : { node: null, memory: null };
  const asked = feedback ? feedbackArea(ctx, feedback) : null;
  const more = askMore(ctx, talk);
  return { node: el('div', { class: 'bottom' }, chips.node, asked?.node, more.node), stop: more.stop, feedback: asked, memory: chips.memory };
}
