// Find answer: matches a question to the book. Returns the answer to show, or none plus the closest things to offer.
// It never makes anything up: if nothing in the book fits, the answer is { type: 'none' }.
import { keyWords, allWords } from './words.js';
import { wordMatch } from './spelling.js';
import { questionKind, fitIndex, KIND_WORDS, WEATHER_WORDS } from './understand.js';
import { isInfo, infoOf } from './info.js';
import { whereOf } from './where.js';
import { fieldForKind, fieldOf } from './fields.js';

// The question's words, plus each pair joined ("pick axe" -> pickaxe, "book shelf" -> bookshelf).
// A match on a joined pair counts a little extra, since it explains two words.
// skip: words to leave out ("snow" in "does it snow in a taiga" says it's about weather, not a snowy biome).
function questionWords(text, skip = new Set()) {
  const words = keyWords(text).filter((w) => !skip.has(w)).map((w) => ({ w, bonus: 0 }));
  const joined = [];
  for (let i = 0; i < words.length - 1; i++) joined.push({ w: words[i].w + words[i + 1].w, bonus: 0.5, parts: [words[i].w, words[i + 1].w] });
  return [...words, ...joined];
}

// How well an entry's words are covered by the question. full: every entry word was said.
export function scoreEntry(entry, asked) {
  let matched = 0;
  let quality = 0;
  let fuzzy = false;
  for (const w of entry.words) {
    const best = Math.max(0, ...asked.map((a) => (wordMatch(a.w, w) ? wordMatch(a.w, w) + a.bonus : 0)));
    if (best) {
      matched += 1;
      quality += best;
      fuzzy ||= !asked.some((a) => wordMatch(a.w, w) === 1);
    }
  }
  const full = matched === entry.words.length;
  return { full, matched, fuzzy, score: full ? entry.words.length * 10 + quality : quality };
}

// What a fact needs to answer some kinds of question: "iron golems drop iron ingots" doesn't answer
// "how do I mine iron", and "how much does bread fill you" needs how much food it is.
const FACT_NEEDS = {
  mine: (f) => Boolean(f.mineWith || f.fromBlocks),
  find: (f) => Boolean(f.fromBlocks || f.fromMobs),
  food: (f) => Boolean(f.food),
};

const PLACE_KINDS = new Set(['find', 'get', 'about', 'any']);

// What kind of answer a target gives: a recipe, a fact, a mob card, a guide, an info page (biome, enchant,
// effect, topic), a where line, or nothing yet. Things with both a recipe and facts (stone) give the fact when the
// question suits facts better ("what tool for stone"). A where question always gets the where line if there is one,
// never the description; so does "how do I get" something you can't craft, and "how do I make" a mob you build.
export function answerType(target, book, guides, kind = 'any') {
  if (target.type === 'guide') return guides.some((g) => g.id === target.id) ? 'guide' : null;
  if (target.type === 'build') return book.builds?.some((b) => b.id === target.id) ? 'build' : null;
  // A place (a village) answers where it is, and what it is. "How do I build a village" isn't in the book.
  if (target.type === 'place') return book.places?.[target.id] && PLACE_KINDS.has(kind) ? 'where' : null;
  const recipes = book.recipes[target.id];
  const realRecipe = target.type === 'item' && (recipes || []).some((r) => !r.unpack);
  const where = whereOf(book, target);
  const built = where?.build && (kind === 'make' || kind === 'get');
  if (where && (kind === 'find' || (kind === 'get' && !realRecipe) || built)) return 'where';
  // One fact in its own slot answers its kind of question: "what do cats eat", "what gifts do cats bring".
  const field = fieldForKind(kind, target);
  if (field && field !== 'where' && fieldOf(book, target, field)) return 'field';
  if (target.type === 'mob') return book.mobs[target.id] ? 'mob' : null;
  if (isInfo(target.type)) return infoOf(book, target) ? target.type : null;
  const at = (type) => fitIndex(kind, type);
  const factFirst = at('fact') >= 0 && (at('recipe') < 0 || at('fact') < at('recipe'));
  const fact = book.facts[target.id];
  const hasFact = Boolean(fact) && (!FACT_NEEDS[kind] || FACT_NEEDS[kind](fact));
  if (hasFact && factFirst) return 'fact';
  if (realRecipe) return 'recipe';
  if (hasFact) return 'fact';
  if (recipes) return 'unpack';
  return where ? 'where' : null;
}

// In a mining question the tool it names ("which pickaxe for diamonds") is the tool, not the thing asked about.
const isTool = (target) => /_(pickaxe|shovel|axe|hoe)$/.test(target.id);

const isTameGuide = (guides, id) => guides.find((g) => g.id === id)?.askedAs.some((p) => /\btame\b/.test(p));
const sameTarget = (a, b) => a.type === b.type && a.id === b.id;

// Order full matches by how well they fit the kind of question, then by score.
function pick(candidates, kind, guides) {
  const usable = candidates.filter((c) => {
    if (c.type === 'unpack') return !['tame', 'breed', 'gifts', 'drops', 'max', 'weather', 'food', 'eats', 'danger', 'does'].includes(kind);
    // "Ride a boat" is a taming word with no animal: any guide said in full answers it.
    if (kind === 'tame') return c.type === 'guide' || c.type === 'field';
    return fitIndex(kind, c.type) >= 0;
  });
  if (!usable.length) return null;
  const best = Math.max(...usable.map((c) => c.score));
  // Among the strongest matches, the kind of answer that suits the question wins. Unpacking a block comes last.
  // A misspelling ("leather" for "feathers") never beats a name said exactly.
  const close = usable.filter((c) => c.score >= best - 0.5);
  const exactOnes = close.filter((c) => !c.fuzzy);
  const top = exactOnes.length ? exactOnes : close;
  const rankOf = (c) => (c.type === 'unpack' ? 99 : fitIndex(kind, c.type));
  return [...top].sort((a, b) => rankOf(a) - rankOf(b) || b.score - a.score)[0];
}

// A build's name can hold a question word: "pet" (taming) in "pet bed", "gift" in "gift box". When the question says
// the name word for word and the rest of it asks to make or build ("how do I make a pet bed"), it's a make question,
// and the name's words are about the thing. Returns the name's words, or null. "What gifts does a cat bring" says
// no build's name, so it stays a gifts question.
export function buildNamed(question, list) {
  const said = ` ${allWords(question).join(' ')} `;
  for (const entry of list) {
    if (entry.target.type !== 'build' || !entry.phrase || !said.includes(` ${entry.phrase} `)) continue;
    if (questionKind(said.replace(` ${entry.phrase} `, ' ')) === 'make') return new Set(entry.phrase.split(' '));
  }
  return null;
}

// Kinds of question where knowing the thing isn't enough: if the book has no answer of that kind, it says so.
const NEEDS_KIND = new Set(['find', 'get', 'make', 'drops', 'tame', 'breed', 'gifts', 'mine', 'food', 'eats', 'danger', 'does', 'max', 'weather']);
const KNOWN_TYPES = new Set(['mob', 'item', 'place']);

// list: from buildSearchList. Returns { type, target, kind, suggestions }. The type is an answer type, 'none'
// (not in the book), or 'missing' (it knows the thing, but not this kind of answer: "where do pandas live").
export function findAnswer(question, list, book, guides) {
  let kind = questionKind(question);
  const named = kind === 'make' ? null : buildNamed(question, list);
  if (named) kind = 'make';
  const asked = questionWords(question, kind === 'weather' ? WEATHER_WORDS : undefined);
  const scored = [];
  const known = [];
  // A match has to come from the question's own words, not only its kind words: "find" alone doesn't make
  // "find a stronghold" a match for "where do I find diamonds", and "tool" isn't a misspelled "wool".
  // A question made only of kind words ("how do I get food") can still match a guide whose phrase it says word for
  // word, if the phrase has at least 2 words ("get food"). One word ("eat") is too little: that's a follow-up.
  const thingWords = asked.filter((a) => named?.has(a.w) || (!KIND_WORDS.has(a.w) && !(a.parts && a.parts.every((p) => KIND_WORDS.has(p)))));
  const said = ` ${allWords(question).join(' ')} `;
  const saysPhrase = (entry) => entry.phrase?.includes(' ') && said.includes(` ${entry.phrase} `);
  const kindOnly = (entry, s) => !thingWords.length && entry.target.type === 'guide' && s.full && saysPhrase(entry);
  for (const entry of list) {
    const s = scoreEntry(entry, asked);
    if (!s.matched || !(scoreEntry(entry, thingWords).matched || kindOnly(entry, s))) continue;
    const type = answerType(entry.target, book, guides, kind);
    if (type) scored.push({ ...s, type, target: entry.target, label: entry.label, size: entry.words.length });
    if (s.full && KNOWN_TYPES.has(entry.target.type) && (type || answerType(entry.target, book, guides))) known.push({ ...s, target: entry.target });
  }
  const full = scored.filter((s) => s.full);
  const best = (list2) => [...list2].sort((a, b) => b.score - a.score)[0];
  // The thing said most exactly. A misspelt match ("good food" for "wood") only counts if nothing was said exactly.
  const exact = best(full.filter((s) => !s.fuzzy)) || best(full);
  // "What do pandas eat": eating, about a mob.
  if (kind === 'food' && exact?.target.type === 'mob') kind = 'eats';
  let chosen = pick(full, kind, guides);
  // If something said more exactly can't answer this kind of question ("make an iron golem"), don't answer with
  // something smaller it contains ("iron"): say it's not in the book, and offer the exact thing first.
  const toolInMiningQuestion = kind === 'mine' && exact && isTool(exact.target);
  if (chosen && exact && !toolInMiningQuestion && exact.score >= chosen.score + 5 && !sameTarget(exact.target, chosen.target)) chosen = null;
  // An unpack-only item ("a diamond from a diamond block") is a weak answer: a guide or fact about it is better.
  let answer = chosen;
  if (chosen && chosen.type === 'unpack') {
    const better = scored.filter((s) => (s.type === 'guide' || s.type === 'fact') && s.matched).sort((a, b) => b.score - a.score)[0];
    answer = better || { ...chosen, type: 'recipe' };
  }
  const suggestions = suggest(scored, answer, kind, guides);
  if (answer?.type === 'field') return { type: 'field', target: answer.target, field: fieldForKind(kind, answer.target), kind, suggestions };
  if (answer) return { type: answer.type, target: answer.target, kind, suggestions };
  // It knows the thing, but not this kind of answer yet.
  const thing = NEEDS_KIND.has(kind) && best(known);
  if (thing) return { type: 'missing', target: thing.target, kind, suggestions: suggestions.filter((t) => !sameTarget(t, thing.target)) };
  return { type: 'none', kind, suggestions };
}

// Up to 3 other things the question might have meant, best first, never the answer itself.
export function suggest(scored, answer, kind, guides) {
  const out = [];
  const seen = (t) => out.some((o) => sameTarget(o, t)) || (answer && sameTarget(answer.target, t));
  const guideFirst = (s) => (kind === 'tame' && s.type === 'guide' ? 1 : 0);
  // Best match first. Among equal matches, answers that suit the question (a mining fact for "how do I mine iron"),
  // then the shorter name: "iron ore" before "deepslate iron ore".
  const fitRank = (x) => (fitIndex(kind, x.type) >= 0 ? fitIndex(kind, x.type) : 99);
  const ordered = [...scored].sort(
    (a, b) => guideFirst(b) - guideFirst(a) || b.matched - a.matched || b.score - a.score || fitRank(a) - fitRank(b) || a.size - b.size,
  );
  for (const s of ordered) {
    if (out.length >= 3) break;
    // A part match only on a misspelling ("cake" and "cave spider") is too weak to offer.
    if (!s.full && s.score < 1) continue;
    if (!seen(s.target)) out.push(s.target);
  }
  if (kind === 'tame') {
    for (const g of guides) if (out.length < 3 && isTameGuide(guides, g.id) && !seen({ type: 'guide', id: g.id })) out.push({ type: 'guide', id: g.id });
  }
  return out;
}
