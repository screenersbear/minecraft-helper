// Follow-ups: "how do I get it?" or "what about the sugar?" right after an answer. They don't name the thing, or
// they name one of the last recipe's ingredients, so the last thing (or that ingredient) fills the gap.
import { splitWords, keyWords } from './words.js';
import { wordMatch } from './spelling.js';
import { questionKind, KIND_WORDS } from './understand.js';
import { targetName } from './target-name.js';
import { parseTarget } from './where.js';
import { INFO_TYPES } from './info.js';

// Words that point back at the last thing (most are filler already): "get one", "what about those".
const POINTING = new Set(['one', 'ones', 'thing', 'things', 'stuff']);

// How to ask each kind of question again about another thing.
const ASK_AGAIN = {
  make: 'how do I make',
  get: 'how do I get',
  find: 'where do I find',
  drops: 'what drops from',
  tame: 'how do I tame',
  mine: 'how do I mine',
  food: 'how much food is',
  eats: 'what does it eat',
  danger: 'is it dangerous',
  does: 'what is it used for',
  max: 'max level of',
  weather: 'does it rain in',
};

// The thing on an answer screen, from its address: { target, kind }, or null.
const PAGE_KIND = { recipe: 'make', where: 'find', fact: 'get' };
export function thingOfRoute(route) {
  const { page, id } = route;
  if (!id) return null;
  let target = null;
  if (page === 'recipe' || page === 'fact') target = { type: 'item', id };
  else if (page === 'mob' || page === 'guide' || INFO_TYPES.includes(page)) target = { type: page, id };
  else if (page === 'where' || page === 'missing') target = parseTarget(id);
  if (!target) return null;
  const asked = route.kind || questionKind(route.q);
  return { target, kind: asked !== 'any' && asked !== 'about' ? asked : PAGE_KIND[page] || 'any' };
}

// The last thing's name, and the names of what its recipe needs (one each, "coal or charcoal" as coal).
export function describeLast(last, book, guides) {
  if (!last?.target) return null;
  const name = targetName(book, guides, last.target);
  const recipe = last.target.type === 'item' ? book.recipes[last.target.id]?.find((r) => !r.unpack) : null;
  const cells = recipe ? [...(recipe.grid || []).flat(), recipe.input, ...(recipe.slots || [])].filter(Boolean) : [];
  const parts = [...new Set(cells.map((c) => c.split('|')[0]))].map((id) => book.items[id]?.name).filter(Boolean);
  return { name, kind: last.kind || 'any', parts };
}

// question: what was heard. last: from describeLast, or null. Returns the question to match: the same one, or
// one with the last thing (or an ingredient) put in.
export function withLastThing(question, last) {
  if (!last) return question;
  const words = splitWords(question);
  const things = keyWords(question).filter((w) => !KIND_WORDS.has(w) && !POINTING.has(w));
  const own = questionKind(question);
  const whatAbout = /^(what|how) about\b|^and\b/.test(words.join(' '));
  const kind = whatAbout || own === 'any' || own === 'about' ? last.kind : own;
  const again = ASK_AGAIN[kind];
  // "How do I get it?": nothing named, so it's about the last thing.
  if (!things.length) return words.length ? `${question} ${last.name}` : question;
  // "What about the sugar?": one of the things the last recipe needs.
  const part = last.parts.find((p) => things.every((t) => keyWords(p).some((n) => wordMatch(t, n))));
  if (part) return again ? `${again} ${part}` : part;
  // "What about wolves?": something new, asked the same way as last time.
  if (whatAbout && again) return `${again} ${words.filter((w) => !['what', 'how', 'about', 'and'].includes(w)).join(' ')}`;
  return question;
}
