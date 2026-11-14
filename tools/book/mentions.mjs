// Mentions: the names of things in hand-written text (a guide step, a fact). Every thing mentioned needs a link to
// its answer, so a kid can tap it or ask about it next. This finds the names that aren't linked yet, and checks
// that every link leads somewhere.
import { parseLinks } from '../../logic/links.js';
import { plural, mobPlural } from '../../logic/plural.js';
import { answerType } from '../../logic/find-answer.js';
import { fieldOf } from '../../logic/fields.js';
import { infoOf, isInfo } from '../../logic/info.js';
import { plainNames } from '../../logic/search-list.js';

// Names that are also everyday words ("light up an area", "the fire"): not counted as mentions.
const EVERYDAY = new Set(['light', 'air', 'fire', 'target', 'water', 'lava', 'map', 'egg', 'eggs', 'stray', 'parched', 'ore', 'ores', 'the end', 'wood']);
// Words for one fact, that need a link to that fact: "it may leave you a gift".
const FACT_WORDS = { gift: { type: 'mob', id: 'cat', field: 'gifts' }, gifts: { type: 'mob', id: 'cat', field: 'gifts' } };

const same = (a, b) => a && b && a.type === b.type && a.id === b.id;

// Other ways things are written, for families: "wood planks" are oak planks to the app.
const ALIASES = { 'wood planks': { type: 'item', id: 'oak_planks' } };

// Every way a thing is written, longest first: [{ words: 'raw cod', target }]. Names come before plurals, so
// "nether bricks" is the block, not more than one Nether brick.
export function mentionWords(book) {
  const found = new Map();
  const add = (words, target) => {
    const w = words.toLowerCase();
    if (!EVERYDAY.has(w) && !found.has(w)) found.set(w, target);
  };
  const hasAnswer = (id) => Boolean(book.recipes[id] || book.facts[id] || book.fields?.item?.[id]);
  // Mobs first: "chicken" alone is the animal, "raw chicken" is the food. Families ("bed", "wool") point at the
  // usual one, like the white bed.
  const things = [
    ...Object.entries(book.mobs).map(([id, m]) => [m.name, { type: 'mob', id }, mobPlural]),
    ...Object.entries(book.places || {}).map(([id, p]) => [p.name, { type: 'place', id }, plural]),
    ...Object.entries(book.biomes || {}).map(([id, b]) => [b.name, { type: 'biome', id }, plural]),
    ...Object.entries(book.items).filter(([id]) => !id.startsWith('@')).map(([id, item]) => [item.name, { type: 'item', id }, plural]),
    ...plainNames(book.items, hasAnswer).map((p) => [p.phrase, { type: 'item', id: p.id }, plural]),
    ...Object.entries(ALIASES).map(([w, t]) => [w, t, plural]),
  ];
  // Things with an answer win over things without ("carrots" are carrots to eat, not the crop block).
  const answered = ([, t]) => t.type !== 'item' || hasAnswer(t.id);
  for (const [name, target] of things.filter(answered)) add(name, target);
  for (const [name, target, many] of things.filter(answered)) add(many(name), target);
  for (const [name, target, many] of things) [name, many(name)].forEach((w) => add(w, target));
  for (const [w, t] of Object.entries(FACT_WORDS)) found.set(w, { type: t.type, id: t.id, field: t.field });
  return [...found].map(([words, target]) => ({ words, target })).sort((a, b) => b.words.length - a.words.length);
}

// Names in plain words that aren't linked: [{ at, text, target }]. owners: what the text is about (their own names
// need no link). The same thing linked elsewhere in the text counts too, so it's linked once, not every time.
// field: the fact the text is, so its own fact word ("gift" in the cat's gifts) needs no link.
export function unlinked(text, words, owners = [], field = '') {
  const parts = parseLinks(text);
  const linked = parts.filter((p) => p.target).map((p) => ({ ...p.target, field: p.field }));
  const out = [];
  let at = 0;
  for (const part of parts) {
    if (part.target) {
      at += part.text.length;
      continue;
    }
    const lower = part.text.toLowerCase();
    const taken = new Array(lower.length).fill(false);
    for (const w of words) {
      const re = new RegExp(`(?<![a-z'])${w.words.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![a-z])`, 'g');
      for (const m of lower.matchAll(re)) {
        const span = [m.index, m.index + w.words.length];
        if (taken.slice(...span).some(Boolean)) continue;
        taken.fill(true, ...span);
        const t = w.target;
        if ((!t.field || t.field === field) && owners.some((o) => same(t, o))) continue;
        if (linked.some((l) => same(l, t) && (l.field || null) === (t.field || null))) continue;
        out.push({ at: at + m.index, text: part.text.slice(m.index, m.index + w.words.length), target: t });
      }
    }
    at += part.text.length;
  }
  return out.sort((a, b) => a.at - b.at);
}

// Why a link leads nowhere, or null if it's fine.
export function badLink(link, book, guides) {
  const { target, field } = link;
  if (field) return fieldOf(book, target, field) ? null : `no ${field} fact for ${target.type} ${target.id}`;
  if (target.type === 'guide') return guides.some((g) => g.id === target.id) ? null : `no guide called ${target.id}`;
  if (target.type === 'place') return book.places?.[target.id] ? null : `no place called ${target.id}`;
  if (target.type === 'mob') return book.mobs[target.id] ? null : `no mob called ${target.id}`;
  if (isInfo(target.type)) return infoOf(book, target) ? null : `no ${target.type} called ${target.id}`;
  if (target.type !== 'item') return `no kind of thing called ${target.type}`;
  if (!book.items[target.id]) return `no item called ${target.id}`;
  return answerType(target, book, guides) ? null : `nothing to say about ${target.id}`;
}

// Puts links in for the mentions found: "Feed it raw cod" -> "Feed it [raw cod](item:cod)". Only the first time
// each thing is mentioned.
export function addLinks(text, found) {
  const seen = new Set();
  const first = found.filter((f) => {
    const key = `${f.target.type}:${f.target.id}#${f.target.field || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  // Positions are in the words without links: walk the text and count only plain characters.
  const parts = parseLinks(text);
  let out = '';
  let plainAt = 0;
  for (const part of parts) {
    if (part.target) {
      out += `[${part.text}](${part.target.type}:${part.target.id}${part.field ? `#${part.field}` : ''})`;
      plainAt += part.text.length;
      continue;
    }
    let s = part.text;
    const here = first.filter((f) => f.at >= plainAt && f.at < plainAt + s.length).sort((a, b) => b.at - a.at);
    for (const f of here) {
      const i = f.at - plainAt;
      const link = `[${f.text}](${f.target.type}:${f.target.id}${f.target.field ? `#${f.target.field}` : ''})`;
      s = s.slice(0, i) + link + s.slice(i + f.text.length);
    }
    out += s;
    plainAt += part.text.length;
  }
  return out;
}
