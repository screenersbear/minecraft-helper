// Understand: what kind of question is it? "How do I tame a wolf" is a taming question, "what does a creeper drop"
// is a drops question. The kind decides which answers fit.
import { splitWords } from './words.js';
import { isInfo } from './info.js';

// The first rule whose words appear wins, so more specific kinds come first. A rule with a test uses that instead.
// "what do pandas eat" is a food question here; with a mob it becomes 'eats' (what it eats) when the answer is found.
const KINDS = [
  { kind: 'gifts', words: ['gift', 'gifts', 'present', 'presents'] },
  { kind: 'breed', words: ['breed', 'breeding', 'baby', 'babies', 'mate'] },
  { kind: 'tame', words: ['tame', 'taming', 'befriend', 'trust', 'ride', 'riding', 'pet', 'adopt'] },
  { kind: 'drops', words: ['drop', 'drops', 'dropped', 'loot'] },
  { kind: 'mine', words: ['mine', 'mining', 'break', 'breaking', 'dig', 'pickaxe', 'tool'] },
  { kind: 'max', words: ['max', 'maximum', 'highest', 'strongest', 'top'] },
  { kind: 'find', words: ['find', 'where', 'wheres', 'locate', 'spawn', 'spawns', 'level', 'live', 'lives', 'living'] },
  { kind: 'get', words: ['get', 'obtain', 'collect'] },
  { kind: 'make', words: ['make', 'craft', 'build', 'create', 'need', 'recipe', 'made', 'crafted', 'cook', 'smelt'] },
  { kind: 'food', words: ['food', 'foods', 'fill', 'fills', 'filling', 'full', 'eat', 'eats', 'eating', 'feed', 'feeding', 'hungry', 'drumstick', 'drumsticks'] },
  { kind: 'weather', words: ['snow', 'snows', 'snowing', 'rain', 'rains', 'raining', 'weather', 'thunder', 'storm'] },
  { kind: 'danger', words: ['dangerous', 'danger', 'safe', 'hostile', 'friendly', 'peaceful', 'attack', 'attacks', 'hurt', 'hurts', 'scary', 'mean', 'nice', 'bite', 'bites'] },
  { kind: 'does', words: ['use', 'used', 'uses', 'useful', 'purpose'], test: isDoesQuestion },
  { kind: 'about', words: ['what', 'whats', 'who'] },
];

// "what does a totem do", "what is a lead for", "what can I do with a saddle", "how do I use a compass".
function isDoesQuestion(words) {
  if (words.some((w) => ['use', 'used', 'uses', 'useful', 'purpose'].includes(w))) return true;
  const what = words.includes('what') || words.includes('whats');
  const last = words[words.length - 1];
  return what && (last === 'do' || last === 'does' || last === 'for' || words.join(' ').includes('do with'));
}

// Weather words make a weather question, but they're also things ("how do I make snow"), so they still count
// as words about the thing. In a weather question they're left out of matching instead (WEATHER_WORDS).
export const WEATHER_WORDS = new Set(KINDS.find((k) => k.kind === 'weather').words.map((w) => w.replace(/s$/, '')));

// Every word that only says what kind of question it is ("find", "make"): on its own it says nothing about the thing.
// "pickaxe" is left out: it's also a thing you can ask about ("how do I make a pickaxe").
export const KIND_WORDS = new Set(KINDS.filter((k) => k.kind !== 'weather').flatMap((k) => k.words).filter((w) => w !== 'pickaxe'));

const MINING_WORDS = ['mine', 'mining', 'break', 'breaking', 'dig', 'tool'];

// "pickaxe" is usually the thing asked about ("how do I make a pickaxe", "what does a pickaxe need").
// It makes a mining question only with "for" after it ("what pickaxe do I need for obsidian") or another mining word.
export function questionKind(text) {
  const words = splitWords(text);
  const at = words.indexOf('pickaxe');
  if (at >= 0 && words.indexOf('for', at) > at) return 'mine';
  const mining = words.some((w) => MINING_WORDS.includes(w));
  const says = (k) => (k.test ? k.test(words) : k.words.some((w) => words.includes(w)));
  const found = KINDS.filter((k) => (k.kind !== 'mine' || mining) && says(k));
  return found.length ? found[0].kind : 'any';
}

// Which kinds of answer suit a question kind, best first. 'info' is a biome, enchantment, potion effect or topic.
// 'where' is a line from where.json (or a place, like a village). 'build' is a build to make layer by layer.
// 'field' is one fact in its own slot (what a cat eats, what gifts it brings: see fields.js). With no fitting answer,
// the app says it doesn't know that yet.
export const FITS = {
  gifts: ['field'],
  breed: ['field', 'guide'],
  tame: ['guide', 'field'],
  drops: ['mob', 'fact'],
  mine: ['fact', 'guide'],
  find: ['where', 'guide', 'fact', 'recipe'],
  get: ['recipe', 'guide', 'fact', 'where'],
  make: ['recipe', 'build', 'guide', 'fact', 'where'],
  max: ['info'],
  food: ['fact', 'info', 'guide'],
  eats: ['field'],
  weather: ['info'],
  danger: ['field', 'mob', 'guide'],
  does: ['field', 'info', 'guide'],
  about: ['mob', 'fact', 'info', 'recipe', 'guide', 'build', 'where'],
  any: ['recipe', 'guide', 'build', 'mob', 'fact', 'info', 'where'],
};

// Every kind of question, for checking a kind read from the address.
export const ALL_KINDS = Object.keys(FITS);

// Where an answer type sits in a question kind's list (lower is better), or -1 if it doesn't suit it.
export function fitIndex(kind, type) {
  return (FITS[kind] || FITS.any).indexOf(isInfo(type) ? 'info' : type);
}
