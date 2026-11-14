// Where a link in hand-written text goes: "[gift](mob:cat#gifts)" opens what cats' gifts are, "[raw cod](item:cod)"
// opens raw cod's answer. The build checks every link has somewhere to go (tools/check-links.mjs).
import { answerType } from './find-answer.js';
import { fieldOf } from './fields.js';
import { hashForAnswer } from './routes.js';

// link: { target, field? } from parseLinks. Returns an answer like findAnswer's ({ type, target, field? }), or null.
// Where to find a thing is its own answer type ('where'), so it has one address.
export function linkAnswer(link, book, guides) {
  const { target, field } = link;
  if (field === 'where') return fieldOf(book, target, 'where') ? { type: 'where', target } : null;
  if (field) return fieldOf(book, target, field) ? { type: 'field', target, field } : null;
  const type = answerType(target, book, guides);
  return type ? { type, target } : null;
}

export function linkHash(link, book, guides, question = '') {
  const answer = linkAnswer(link, book, guides);
  return answer ? hashForAnswer(answer, question) : null;
}
