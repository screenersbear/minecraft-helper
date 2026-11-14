// Searching one add-on: "how do I get out of the bloop" -> the boss fight. Only that add-on's answers, so a
// question asked on the Add-ons page never lands on the regular game. Questions with no answer written yet
// ("what are the new enchantments") are found too, so the page can say "I don't know that yet" and log it.
import { keyWords } from './words.js';
import { treeOf } from './addon.js';

const STRONG = 2; // a word in the answer's title, the questions that lead to it, or its search words
const WEAK = 0.5; // a word in what the answer says (on top, so "is there a submarine" picks the answer that says it)

// The words that find one answer: { strong, weak } sets.
function wordsOf(pack, id) {
  const answer = pack.answers[id];
  const asks = Object.values(pack.answers).flatMap((a) => (a.more || []).filter((m) => m.id === id).map((m) => m.ask));
  const strong = [answer?.title, ...asks, ...(answer?.words || [])].filter(Boolean).join(' ');
  return { strong: new Set(keyWords(strong)), weak: new Set(keyWords(answer?.say || '')) };
}

// The id of the best answer for the question, or null when nothing in the add-on matches. A question that only
// names the add-on ("what is the bloop") gets its first topic.
export function findInAddon(pack, question) {
  const own = new Set(keyWords(pack.name));
  const asked = keyWords(question).filter((w) => !own.has(w));
  if (!asked.length) return pack.topics[0];
  let best = null;
  let bestScore = 0;
  // Topics first, then one level deeper at a time, so a tie goes to the broader answer.
  for (const id of treeOf(pack).keys()) {
    const { strong, weak } = wordsOf(pack, id);
    const score = asked.reduce((sum, w) => sum + (strong.has(w) ? STRONG : 0) + (weak.has(w) ? WEAK : 0), 0);
    if (score > bestScore) {
      best = id;
      bestScore = score;
    }
  }
  return best;
}
