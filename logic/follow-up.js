// Follow-ups: "what gifts?", "how do I get it?" or "what about the sugar?" right after an answer. They don't name
// the thing, or they name one of the last recipe's ingredients. Topic memory fills the gap: the topic (the cat,
// after the cat guide) and everything the last answer mentioned (see data/last-thing.js).
import { splitWords, keyWords } from './words.js';
import { wordMatch } from './spelling.js';
import { questionKind, KIND_WORDS } from './understand.js';
import { targetName } from './target-name.js';
import { parseTarget, parseFieldKey } from './where.js';
import { INFO_TYPES } from './info.js';
import { fieldForKind, fieldOf } from './fields.js';
import { findAnswer } from './find-answer.js';

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
// The kind of question each fact answers.
const FIELD_KIND = { where: 'find', eats: 'eats', tame: 'tame', breed: 'breed', gifts: 'gifts', dangerous: 'danger', uses: 'does' };
export function thingOfRoute(route) {
  const { page, id } = route;
  if (!id) return null;
  let target = null;
  let kind = PAGE_KIND[page];
  if (page === 'recipe' || page === 'fact') target = { type: 'item', id };
  else if (page === 'mob' || page === 'guide' || INFO_TYPES.includes(page)) target = { type: page, id };
  else if (page === 'where' || page === 'missing') target = parseTarget(id);
  else if (page === 'field') {
    const key = parseFieldKey(id);
    target = key?.target;
    kind = key && FIELD_KIND[key.field];
  }
  if (!target) return null;
  const asked = route.kind || questionKind(route.q);
  return { target, kind: asked !== 'any' && asked !== 'about' ? asked : kind || 'any' };
}

// The words in a question that could name a thing: "what gifts?" has none, "what about the sugar?" has "sugar".
export const thingWords = (question) => keyWords(question).filter((w) => !KIND_WORDS.has(w) && !POINTING.has(w));

const same = (a, b) => Boolean(a && b) && a.type === b.type && a.id === b.id;
const NAMED = new Set(['mob', 'item', 'place']);
const answerOf = (target, field, kind) => (field === 'where' ? { type: 'where', target, kind: 'find' } : { type: 'field', target, field, kind });

// A follow-up that names nothing ("what gifts?", "what do they eat?", "how do I get it?"), answered from topic
// memory: { topic, mentions: [{ target, field? }] }. Tries the topic's facts first, then the things the last answer
// mentioned, then the topic by name. If none of them knows, it's a missing answer about the topic ("I don't know
// that about cats yet"). Returns an answer like findAnswer's, or null to match the question the usual way.
export function followUp(question, memory, book, guides, list) {
  const topic = memory?.topic;
  // A question that names something the app knows ("how do I tame a dragon") is about that, not the last answer.
  const names = thingWords(question).some((w) => list.some((entry) => entry.target.type !== 'guide' && entry.words.includes(w)));
  if (!topic || names) return null;
  const kind = questionKind(question);
  const field = fieldForKind(kind, topic);
  if (field && fieldOf(book, topic, field)) return answerOf(topic, field, kind);
  for (const m of memory.mentions || []) {
    const f = fieldForKind(kind, m.target);
    if (f && fieldOf(book, m.target, f)) return answerOf(m.target, f, kind);
  }
  if (!NAMED.has(topic.type)) return null;
  const answer = findAnswer(`${question} ${targetName(book, guides, topic)}`, list, book, guides);
  if (answer.type !== 'none' && same(answer.target, topic)) return answer;
  if (kind !== 'any' && kind !== 'about') return { type: 'missing', target: topic, kind, suggestions: [] };
  return null;
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
  const things = thingWords(question);
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
