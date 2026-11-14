// Search list: every name the app knows, as simple words, pointing at an answer. Built once from the book,
// the guides and the nicknames. Each entry: { words, target: { type: 'item' | 'mob' | 'guide', id }, label }.
import { keyWords } from './words.js';

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

const target = (text) => {
  if (text.startsWith('mob:')) return { type: 'mob', id: text.slice(4) };
  if (text.startsWith('guide:')) return { type: 'guide', id: text.slice(6) };
  return { type: 'item', id: text };
};

// book: data/book.json; guides: data/guides.json; nicknames: data/nicknames.json.
export function buildSearchList(book, guides, nicknames) {
  const list = [];
  const add = (phrase, t, label) => {
    const words = keyWords(phrase);
    if (words.length) list.push({ words, target: t, label: label || phrase });
  };
  const hasAnswer = (id) => Boolean(book.recipes[id] || book.facts[id]);
  for (const [id, item] of Object.entries(book.items)) if (!id.startsWith('@')) add(item.name, { type: 'item', id }, item.name);
  for (const p of plainNames(book.items, hasAnswer)) add(p.phrase, { type: 'item', id: p.id });
  for (const [id, mob] of Object.entries(book.mobs)) add(mob.name, { type: 'mob', id }, mob.name);
  for (const g of guides) {
    add(g.title, { type: 'guide', id: g.id }, g.title);
    for (const phrase of g.askedAs) add(phrase, { type: 'guide', id: g.id }, g.title);
  }
  for (const [phrase, to] of Object.entries(nicknames)) if (!phrase.startsWith('_')) add(phrase, target(to));
  return list;
}
