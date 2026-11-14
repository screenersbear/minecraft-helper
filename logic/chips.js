// Follow-up buttons: 2 or 3 questions a kid might ask next, under every answer. Made from what the answer
// mentions and the facts about its topic. After the cat guide's last step: What gifts?, What do cats eat?,
// Where do cats live? Kids can tap them or say them (saying one works because of topic memory: see follow-up.js).
import { fieldOf, fieldForKind, expectedFacts, kindOfField } from './fields.js';
import { questionKind } from './understand.js';
import { isInfo } from './info.js';
import { targetName } from './target-name.js';
import { mobPlural, plural, article } from './plural.js';
import { linkAnswer } from './link-hash.js';
import { hashForAnswer } from './routes.js';
import { plainNames } from './search-list.js';
import { missingLabel } from './say-missing.js';

const MAX = 3;
// The topic's facts, in the order they're offered. Gifts come last: they only matter once they're mentioned.
const TOPIC_ORDER = ['eats', 'where', 'tame', 'breed', 'dangerous', 'uses', 'gifts'];

const same = (a, b) => Boolean(a && b) && a.type === b.type && a.id === b.id;
// "Shears" and "Sweet Berries" are more than one; "Compass" and "Cactus" aren't.
const isPlural = (name) => /[^su]s$/i.test(name);

// The question for one fact: "What do cats eat?". short: it's about the topic, so "What gifts?" is enough.
export function fieldQuestion(target, field, name, short = false) {
  const many = target.type === 'mob' ? mobPlural(name) : plural(name);
  const one = isPlural(name) ? String(name).toLowerCase() : article(name);
  const ask = {
    where: target.type === 'mob' ? `Where do ${many} live?` : `Where do I find ${many}?`,
    eats: `What do ${many} eat?`,
    tame: `How do I tame ${one}?`,
    breed: `How do I breed ${many}?`,
    gifts: short ? 'What gifts?' : `What gifts do ${many} bring?`,
    dangerous: `Are ${many} dangerous?`,
    uses: isPlural(name) ? `What are ${one} for?` : `What is ${one} for?`,
  };
  return ask[field] || `Tell me about ${many}`;
}

// The question for a thing mentioned: "How do I make a fishing rod?", "What is a creeper?". Null for things
// that don't make a good button (biomes and the like stay as links in the words).
export function thingQuestion(answer, name) {
  const many = answer.target.type === 'mob' ? mobPlural(name) : plural(name);
  const one = isPlural(name) ? String(name).toLowerCase() : article(name);
  if (answer.type === 'recipe' || answer.type === 'unpack') return `How do I make ${one}?`;
  if (answer.type === 'fact') return `How do I get ${many}?`;
  if (answer.type === 'where') return `Where do I find ${many}?`;
  if (answer.type === 'mob') return `What is ${one}?`;
  if (answer.type === 'guide') return name;
  return null;
}

// The plain name of the usual one of a family: the white bed is "bed". Worked out once per book.
const plainCache = new WeakMap();
function plainNameOf(book, target) {
  if (target.type !== 'item') return null;
  if (!plainCache.has(book)) {
    const hasAnswer = (id) => Boolean(book.recipes[id] || book.facts[id] || book.fields?.item?.[id]);
    plainCache.set(book, new Map(plainNames(book.items, hasAnswer).map((p) => [p.id, p.phrase])));
  }
  return plainCache.get(book).get(target.id) || null;
}

const answerOf = (target, field) => (field === 'where' ? { type: 'where', target } : { type: 'field', target, field });

// topic: what the answer is about ({ type, id }). links: what its words link to ([{ target, field? }]).
// here: the address of the answer on screen, so no button leads back to it. guide: the id of the guide on screen,
// so the fact it's all about ("how do I tame a cat" on Tame a cat) isn't offered on it. shown: addresses the page
// already has buttons for. Returns [{ label, hash, missing }]: missing is what the grown-ups list says when a
// button's answer isn't in the book yet ("Missing: zombie, are zombies dangerous").
export function chipsFor({ topic, links = [], here = '', guide = '', shown = [] }, book, guides) {
  const out = [];
  const address = (hash) => decodeURIComponent(hash.split('?')[0]);
  const seen = new Set([here, ...shown].map(address));
  const add = (answer, label) => {
    if (!answer || !label || out.length >= MAX) return;
    const key = address(hashForAnswer(answer, ''));
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ label, hash: hashForAnswer(answer, label) });
  };
  const name = (t) => targetName(book, guides, t);
  const topicName = topic && (plainNameOf(book, topic) || name(topic));
  // A link to the usual one of a family says it plainly: "bed", not "white bed"; "logs" is a log, not an oak log.
  const linkName = (l) => {
    const full = name(l.target);
    const text = l.text.toLowerCase();
    const tail = full.split(' ').slice(-text.split(' ').length).join(' ');
    if (full.toLowerCase().endsWith(` ${text}`)) return l.text;
    return tail !== full && plural(tail).toLowerCase() === text ? tail.toLowerCase() : full;
  };
  const title = guide && guides.find((g) => g.id === guide)?.title;
  const guideFact = title && topic ? fieldForKind(questionKind(title), topic) : null;
  const topicFacts = topic ? TOPIC_ORDER.filter((f) => f !== guideFact && fieldOf(book, topic, f)) : [];
  // 1. Facts the words point at: "it may leave you a gift".
  for (const l of links) if (l.field) add(linkAnswer(l, book, guides), fieldQuestion(l.target, l.field, name(l.target), same(l.target, topic)));
  // A guide all about the topic: "Make a boat" under the boat recipe.
  for (const g of guides) if (g.id !== guide && topic && g.topic === `${topic.type}:${topic.id}`) add({ type: 'guide', target: { type: 'guide', id: g.id } }, g.title);
  // 2. Two facts about the topic.
  for (const f of topicFacts.slice(0, 2)) add(answerOf(topic, f), fieldQuestion(topic, f, topicName));
  // 3. The things mentioned.
  for (const l of links) {
    if (l.field || same(l.target, topic) || isInfo(l.target.type)) continue;
    const answer = linkAnswer(l, book, guides);
    if (answer) add(answer, thingQuestion(answer, linkName(l)));
  }
  // 4. More facts about the topic, if there's room.
  for (const f of topicFacts.slice(2)) add(answerOf(topic, f), fieldQuestion(topic, f, topicName));
  // 5. Facts it should have that the book doesn't yet, if there's room. They still show: tapping one says "I don't
  // know that yet" and saves it. Not on the "I don't know" page itself.
  const missing = topic && !address(here).startsWith('#/missing/') ? expectedFacts(book, topic).filter((f) => !fieldOf(book, topic, f)) : [];
  for (const f of missing) {
    if (out.length >= MAX) break;
    const label = fieldQuestion(topic, f, topicName);
    const kind = kindOfField(f);
    out.push({ label, hash: hashForAnswer({ type: 'missing', target: topic, kind }, label), missing: missingLabel(name(topic), label, kind) });
  }
  return out;
}
