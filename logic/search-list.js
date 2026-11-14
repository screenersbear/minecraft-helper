// Search list: every name the app knows, as simple words, pointing at an answer. Built once from the book,
// the guides, the builds and the nicknames. Each entry: { words, target: { type, id }, label }. The type is 'item',
// 'mob', 'guide', 'build' (a cat house, a treehouse), 'place' (a village, a stronghold), or one of the info types
// (biome, enchant, effect, topic).
import { keyWords, allWords } from './words.js';
import { INFO_TYPES } from './info.js';

// "Red Bed" -> "Bed", "Oak Planks" -> "Planks", "Wooden Pickaxe" -> "Pickaxe": the plain name, and which kind is the default.
const PREFIXES = [
  'white', 'orange', 'magenta', 'light blue', 'yellow', 'lime', 'pink', 'gray', 'light gray', 'cyan', 'purple', 'blue', 'brown',
  'green', 'red', 'black', 'oak', 'spruce', 'birch', 'jungle', 'acacia', 'dark oak', 'mangrove', 'cherry', 'bamboo', 'crimson',
  'warped', 'pale oak', 'wooden', 'stone', 'iron', 'golden', 'diamond', 'netherite', 'leather', 'chainmail', 'copper',
];
const DEFAULT_ORDER = ['white', 'oak', 'wooden', 'leather', 'iron', 'stone'];

function plainName(name) {
  const lower = name.toLowerCase();
  const prefix = [...PREFIXES].sort((a, b) => b.length - a.length).find((p) => lower.startsWith(`${p} `));
  return prefix ? { prefix, rest: lower.slice(prefix.length + 1) } : null;
}

// Plain names for families of things, pointing at the usual one ("bed" -> white bed, "pickaxe" -> wooden pickaxe).
export function plainNames(items, hasAnswer) {
  const names = new Set(Object.entries(items).filter(([id]) => !id.startsWith('@')).map(([, i]) => i.name.toLowerCase()));
  const groups = new Map();
  for (const [id, item] of Object.entries(items)) {
    if (id.startsWith('@') || !hasAnswer(id)) continue;
    const p = plainName(item.name);
    if (!p || names.has(p.rest)) continue;
    if (!groups.has(p.rest)) groups.set(p.rest, []);
    groups.get(p.rest).push({ id, prefix: p.prefix });
  }
  const out = [];
  for (const [rest, list] of groups) {
    if (list.length < 2) continue;
    const rankOf = (x) => (DEFAULT_ORDER.indexOf(x.prefix) + 1) || 99;
    const best = [...list].sort((a, b) => rankOf(a) - rankOf(b))[0];
    out.push({ phrase: rest, id: best.id });
  }
  return out;
}

// A nickname's target: "mob:wolf", "guide:nether-portal", "biome:taiga", "place:village", or an item id.
const target = (text) => {
  const [type, id] = text.split(':');
  if (id && ['mob', 'guide', 'place', ...INFO_TYPES].includes(type)) return { type, id };
  return { type: 'item', id: text };
};

// Biomes, enchantments, potion effects and topics. An effect named like a mob or item ("wither") is only found
// as "wither effect", so asking about the mob still finds the mob.
function addInfo(book, add, taken) {
  for (const [id, b] of Object.entries(book.biomes || {})) {
    add(b.name, { type: 'biome', id }, b.name);
    for (const phrase of b.also) add(phrase, { type: 'biome', id }, b.name);
  }
  for (const [id, e] of Object.entries(book.enchants || {})) {
    add(e.name, { type: 'enchant', id }, e.name);
    add(`${e.name} enchantment`, { type: 'enchant', id }, e.name);
  }
  for (const [id, e] of Object.entries(book.effects || {})) {
    const t = { type: 'effect', id };
    if (!taken.has(e.name.toLowerCase())) add(e.name, t, e.name);
    for (const phrase of [`${e.name} effect`, `potion of ${e.name}`, `${e.name} potion`, ...e.also]) add(phrase, t, e.name);
  }
  for (const [id, topic] of Object.entries(book.topics || {})) for (const phrase of topic.askedAs) add(phrase, { type: 'topic', id }, topic.title);
  // Places you can find, like villages and strongholds.
  for (const [id, place] of Object.entries(book.places || {})) {
    for (const phrase of [place.name, ...place.askedAs]) add(phrase, { type: 'place', id }, place.name);
  }
}

// book: data/book.json (with book.builds from data/builds.json); guides: data/guides.json; nicknames: data/nicknames.json.
export function buildSearchList(book, guides, nicknames) {
  const list = [];
  const add = (phrase, t, label) => {
    const words = keyWords(phrase);
    if (!words.length) return null;
    const entry = { words, target: t, label: label || phrase };
    list.push(entry);
    return entry;
  };
  const hasAnswer = (id) => Boolean(book.recipes[id] || book.facts[id] || book.fields?.item?.[id]);
  for (const [id, item] of Object.entries(book.items)) if (!id.startsWith('@')) add(item.name, { type: 'item', id }, item.name);
  for (const p of plainNames(book.items, hasAnswer)) add(p.phrase, { type: 'item', id: p.id });
  for (const [id, mob] of Object.entries(book.mobs)) add(mob.name, { type: 'mob', id }, mob.name);
  // Guides keep every word of the phrase too, so "how do I get food" can match "get food" said word for word.
  const addGuide = (phrase, g) => {
    const entry = add(phrase, { type: 'guide', id: g.id }, g.title);
    if (entry) entry.phrase = allWords(phrase).join(' ');
  };
  for (const g of guides) [g.title, ...g.askedAs].forEach((phrase) => addGuide(phrase, g));
  for (const b of book.builds || []) for (const phrase of [b.name, ...(b.also || [])]) add(phrase, { type: 'build', id: b.id }, b.name);
  const taken = new Set([...Object.values(book.items), ...Object.values(book.mobs)].map((x) => x.name.toLowerCase()));
  addInfo(book, add, taken);
  for (const [phrase, to] of Object.entries(nicknames)) if (!phrase.startsWith('_')) add(phrase, target(to));
  return list;
}
