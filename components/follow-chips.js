// Ask next: the follow-up buttons under an answer ("What gifts?", "What do cats eat?"), made by logic/chips.js.
// Tapping one opens its answer, asked as that question. Saying it works too.
import { el } from './el.js';
import { blockButton } from './buttons.js';
import { chipsFor } from '../logic/chips.js';
import { linksIn } from '../logic/links.js';

// follow: { topic, text, here, guide, shown } (see chipsFor). text: the answer's words, with their links.
// Returns the buttons (or null if there are none) and what topic memory keeps: { topic, mentions }.
export function followChips(ctx, { topic = null, text = '', here = '', guide = '', shown = [] } = {}) {
  const links = linksIn(text);
  const chips = chipsFor({ topic, links, here, guide, shown }, ctx.book, ctx.guides);
  const memory = { topic, mentions: links.map((l) => ({ target: l.target, ...(l.field ? { field: l.field } : {}) })) };
  if (!chips.length) return { node: null, memory };
  const buttons = chips.map((c) => blockButton({ label: c.label, tone: 'grey', href: c.hash, extra: { class: 'block-btn notch tone-grey chip-btn' } }));
  const node = el('section', { class: 'follow-chips', 'aria-label': 'Ask next' }, el('h2', { class: 'small-label' }, 'Ask next'), buttons);
  return { node, memory };
}
