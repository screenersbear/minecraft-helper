// Linked words: hand-written text with its links ("leave you a [gift](mob:cat#gifts)") shown as words you can
// tap, each opening its answer. Links are underlined, so colour isn't the only sign.
import { el } from './el.js';
import { parseLinks } from '../logic/links.js';
import { linkHash } from '../logic/link-hash.js';

// The words as page pieces: plain text, and a link for each linked thing. Use inside a paragraph.
export function linkedWords(ctx, text) {
  return parseLinks(text).map((part) => {
    const href = part.target && linkHash(part, ctx.book, ctx.guides);
    return href ? el('a', { class: 'mention', href }, part.text) : part.text;
  });
}

// A whole paragraph of linked words, like the answer's sentence.
export const linkedText = (ctx, text, cls = 'say') => el('p', { class: cls }, linkedWords(ctx, text));
