// Add-on packs: facts about a Marketplace add-on (The Bloop), kept apart from the regular game in
// data/addons/<id>/pack.json. Each answer is short and has two or three "Want to know more?" questions that lead to
// the next answer. A question whose answer isn't written yet still shows: tapping it says "I don't know that yet".
// An answer's address is its pack and its id: "the-bloop:inside".
import { cleanText } from './words.js';

// Said under an answer that only an unofficial site backs up.
export const MAYBE = 'This might be different in your version.';

// "the-bloop:inside" -> { pack, id: 'inside' }; "the-bloop" -> { pack, id: '' }. Null for a pack that isn't there.
export function addonOf(packs, key) {
  const [packId, id = ''] = String(key || '').split(':');
  const pack = (packs || []).find((p) => p.id === packId);
  return pack ? { pack, id } : null;
}

export const addonKey = (pack, id) => (id ? `${pack.id}:${id}` : pack.id);

// The add-ons that are turned on: all of them but the ids in off (the grown-ups screen's switches).
export const turnedOn = (packs, off) => (packs || []).filter((p) => !(off || []).includes(p.id));

// Is the answer backed by the official article or the Marketplace page, not only an unofficial site?
export const isSure = (pack, answer) => (answer.from || []).some((source) => pack.sources?.[source]?.official);

// The question that leads to an answer ("How do I get out?"), or '' if nothing leads to it.
export function askFor(pack, id) {
  for (const answer of Object.values(pack.answers)) {
    const link = (answer.more || []).find((m) => m.id === id);
    if (link) return link.ask;
  }
  return '';
}

// The "Want to know more?" questions under an answer: [{ ask, id, missing }]. missing: no answer written yet.
export const moreOf = (pack, id) => (pack.answers[id]?.more || []).map((m) => ({ ask: m.ask, id: m.id, missing: !pack.answers[m.id] }));

// The other questions next to a missing one: the ones its first question-asker offers, without it.
export function besideOf(pack, id) {
  const parent = Object.keys(pack.answers).find((p) => (pack.answers[p].more || []).some((m) => m.id === id));
  return parent ? moreOf(pack, parent).filter((m) => m.id !== id) : [];
}

// Every answer's place in the tree: the topic it hangs from first, found one level at a time across all topics, so
// an answer that's its own topic stays a topic. Map of id -> parent id (null for a topic). Missing ones are in it too.
export function treeOf(pack) {
  const parent = new Map(pack.topics.map((t) => [t, null]));
  let level = [...pack.topics];
  while (level.length) {
    const next = [];
    for (const id of level) {
      for (const m of pack.answers[id]?.more || []) {
        if (parent.has(m.id)) continue;
        parent.set(m.id, id);
        next.push(m.id);
      }
    }
    level = next;
  }
  return parent;
}

// The picture for an answer: its topic's (an item id), for "Asked before".
export function addonPic(pack, id) {
  const parent = treeOf(pack);
  let at = parent.has(id) ? id : pack.topics[0];
  while (parent.get(at)) at = parent.get(at);
  return pack.pics?.[at] || null;
}

// What add-ons change about a regular mob (pack.changes, by mob id), to say after its regular answer:
// [{ pack, id: the add-on answer, say: "In The Bloop add-on, there are deep sea drowned...", sure }].
export function changesFor(packs, target) {
  if (target?.type !== 'mob') return [];
  return (packs || []).flatMap((pack) => {
    const change = pack.changes?.[target.id];
    if (!change) return [];
    const say = `In ${pack.name} add-on, ${change.say.charAt(0).toLowerCase()}${change.say.slice(1)}`;
    return [{ pack, id: change.answer, say, sure: isSure(pack, change) }];
  });
}

// How many answers sit behind a topic: everything under it in the tree that's written (not the missing ones).
export function countBehind(pack, topic) {
  const parent = treeOf(pack);
  const children = (id) => [...parent].filter(([, p]) => p === id).map(([child]) => child);
  let count = 0;
  const stack = children(topic);
  while (stack.length) {
    const id = stack.pop();
    if (pack.answers[id]) count += 1;
    stack.push(...children(id));
  }
  return count;
}

// "3 more answers", "1 more answer", "" for none.
export const behindLabel = (count) => (count ? `${count} more answer${count === 1 ? '' : 's'}` : '');

// For the grown-ups list: "Missing (The Bloop): what are the new enchantments".
export const addonMissing = (pack, question) => `Missing (${pack.name}): ${cleanText(question) || 'something'}`;
