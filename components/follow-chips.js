// Want to know more?: the buttons under a regular answer ("What gifts?", "What do cats eat?"), made by
// logic/chips.js and shown by dig-deeper.js. Tapping one opens its answer, asked as that question, with this answer
// in the trail. Saying it works too, because of topic memory.
import { digDeeper } from './dig-deeper.js';
import { chipsFor } from '../logic/chips.js';
import { linksIn } from '../logic/links.js';

// follow: { topic, text, here, guide, shown } (see chipsFor). text: the answer's words, with their links.
// Returns the buttons (or null if there are none) and what topic memory keeps: { topic, mentions }.
export function followChips(ctx, { topic = null, text = '', here = '', guide = '', shown = [] } = {}) {
  const links = linksIn(text);
  const chips = chipsFor({ topic, links, here, guide, shown }, ctx.book, ctx.guides);
  const memory = { topic, mentions: links.map((l) => ({ target: l.target, ...(l.field ? { field: l.field } : {}) })) };
  return { node: digDeeper(chips.map((c) => ({ label: c.label, hash: c.hash, missing: c.missing })), here || location.hash), memory };
}
