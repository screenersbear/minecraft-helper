// Find answer: matches a question to the book. Returns the answer to show, or none plus the closest things to offer.
// It never makes anything up: if nothing in the book fits, the answer is { type: 'none' }.
import { keyWords } from './words.js';
import { wordMatch } from './spelling.js';
import { questionKind, fitIndex, KIND_WORDS, WEATHER_WORDS } from './understand.js';
import { isInfo, infoOf } from './info.js';

// The question's words, plus each pair joined ("pick axe" -> pickaxe, "book shelf" -> bookshelf).
// A match on a joined pair counts a little extra, since it explains two words.
// skip: words to leave out ("snow" in "does it snow in a taiga" says it's about weather, not a snowy biome).
function questionWords(text, skip = new Set()) {
  const words = keyWords(text).filter((w) => !skip.has(w)).map((w) => ({ w, bonus: 0 }));
  const joined = [];
  for (let i = 0; i < words.length - 1; i++) joined.push({ w: words[i].w + words[i + 1].w, bonus: 0.5 });
  return [...words, ...joined];
}

// How well an entry's words are covered by the question. full: every entry word was said.
export function scoreEntry(entry, asked) {
  let matched = 0;
  let quality = 0;
  for (const w of entry.words) {
    const best = Math.max(0, ...asked.map((a) => (wordMatch(a.w, w) ? wordMatch(a.w, w) + a.bonus : 0)));
    if (best) {
      matched += 1;
      quality += best;
    }
  }
  const full = matched === entry.words.length;
  return { full, matched, score: full ? entry.words.length * 10 + quality : quality };
}

// What a fact needs to answer some kinds of question: "iron golems drop iron ingots" doesn't answer
// "how do I mine iron", and "how much does bread fill you" needs how much food it is.
const FACT_NEEDS = {
  mine: (f) => Boolean(f.mineWith || f.fromBlocks),
  food: (f) => Boolean(f.food),
};

// What kind of answer a target gives: a recipe, a fact, a mob card, a guide, an info page (biome, enchant,
// effect, topic), or nothing yet. Things with both a recipe and facts (stone) give the fact when the question
// suits facts better ("what tool for stone").
export function answerType(target, book, guides, kind = 'any') {
  if (target.type === 'guide') return guides.some((g) => g.id === target.id) ? 'guide' : null;
  if (target.type === 'mob') return book.mobs[target.id] ? 'mob' : null;
  if (isInfo(target.type)) return infoOf(book, target) ? target.type : null;
  const recipes = book.recipes[target.id];
  const at = (type) => fitIndex(kind, type);
  const factFirst = at('fact') >= 0 && (at('recipe') < 0 || at('fact') < at('recipe'));
  const fact = book.facts[target.id];
  const hasFact = Boolean(fact) && (!FACT_NEEDS[kind] || FACT_NEEDS[kind](fact));
  if (hasFact && factFirst) return 'fact';
  if (recipes && !recipes.every((r) => r.unpack)) return 'recipe';
  if (hasFact) return 'fact';
  if (recipes) return 'unpack';
  return null;
}

// In a mining question the tool it names ("which pickaxe for diamonds") is the tool, not the thing asked about.
const isTool = (target) => /_(pickaxe|shovel|axe|hoe)$/.test(target.id);

const isTameGuide = (guides, id) => guides.find((g) => g.id === id)?.askedAs.some((p) => /\btame\b/.test(p));
const sameTarget = (a, b) => a.type === b.type && a.id === b.id;

// Order full matches by how well they fit the kind of question, then by score.
function pick(candidates, kind, guides) {
  const usable = candidates.filter((c) => {
    if (c.type === 'unpack') return !['tame', 'drops', 'max', 'weather', 'food'].includes(kind);
    if (kind === 'tame') return c.type === 'guide' && isTameGuide(guides, c.target.id);
    return fitIndex(kind, c.type) >= 0;
  });
  if (!usable.length) return null;
  const best = Math.max(...usable.map((c) => c.score));
  // Among the strongest matches, the kind of answer that suits the question wins. Unpacking a block comes last.
  const top = usable.filter((c) => c.score >= best - 0.5);
  const rankOf = (c) => (c.type === 'unpack' ? 99 : fitIndex(kind, c.type));
  return [...top].sort((a, b) => rankOf(a) - rankOf(b) || b.score - a.score)[0];
}

// list: from buildSearchList. Returns { type, target, kind, suggestions }.
export function findAnswer(question, list, book, guides) {
  const kind = questionKind(question);
  const asked = questionWords(question, kind === 'weather' ? WEATHER_WORDS : undefined);
  const scored = [];
  // A match has to come from the question's own words, not only its kind words: "find" alone doesn't make
  // "find a stronghold" a match for "where do I find diamonds", and "tool" isn't a misspelled "wool".
  const thingWords = asked.filter((a) => !KIND_WORDS.has(a.w));
  for (const entry of list) {
    const s = scoreEntry(entry, asked);
    if (!s.matched || !scoreEntry(entry, thingWords).matched) continue;
    const type = answerType(entry.target, book, guides, kind);
    if (type) scored.push({ ...s, type, target: entry.target, label: entry.label, size: entry.words.length });
  }
  const full = scored.filter((s) => s.full);
  let chosen = pick(full, kind, guides);
  // If something said more exactly can't answer this kind of question ("make an iron golem"), don't answer with
  // something smaller it contains ("iron"): say it's not in the book, and offer the exact thing first.
  const exact = [...full].sort((a, b) => b.score - a.score)[0];
  const toolInMiningQuestion = kind === 'mine' && exact && isTool(exact.target);
  if (chosen && exact && !toolInMiningQuestion && exact.score >= chosen.score + 5 && !sameTarget(exact.target, chosen.target)) chosen = null;
  // An unpack-only item ("a diamond from a diamond block") is a weak answer: a guide or fact about it is better.
  let answer = chosen;
  if (chosen && chosen.type === 'unpack') {
    const better = scored.filter((s) => (s.type === 'guide' || s.type === 'fact') && s.matched).sort((a, b) => b.score - a.score)[0];
    answer = better || { ...chosen, type: 'recipe' };
  }
  const suggestions = suggest(scored, answer, kind, guides);
  if (!answer) return { type: 'none', kind, suggestions };
  return { type: answer.type, target: answer.target, kind, suggestions };
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
