// Understand: what kind of question is it? "How do I tame a wolf" is a taming question, "what does a creeper drop"
// is a drops question. The kind decides which answers fit.
import { splitWords } from './words.js';
import { isInfo } from './info.js';

// The first rule whose words appear wins, so more specific kinds come first.
const KINDS = [
  { kind: 'tame', words: ['tame', 'taming', 'befriend', 'breed', 'breeding', 'ride', 'riding', 'pet', 'adopt'] },
  { kind: 'drops', words: ['drop', 'drops', 'dropped', 'loot'] },
  { kind: 'mine', words: ['mine', 'mining', 'break', 'breaking', 'dig', 'pickaxe', 'tool'] },
  { kind: 'max', words: ['max', 'maximum', 'highest', 'strongest', 'top'] },
  { kind: 'find', words: ['find', 'where', 'wheres', 'locate', 'spawn', 'spawns', 'level'] },
  { kind: 'get', words: ['get', 'obtain', 'collect'] },
  { kind: 'make', words: ['make', 'craft', 'build', 'create', 'need', 'recipe', 'made', 'crafted', 'cook', 'smelt'] },
  { kind: 'food', words: ['food', 'foods', 'fill', 'fills', 'filling', 'full', 'eat', 'eating', 'hungry', 'drumstick', 'drumsticks'] },
  { kind: 'weather', words: ['snow', 'snows', 'snowing', 'rain', 'rains', 'raining', 'weather', 'thunder', 'storm'] },
  { kind: 'about', words: ['what', 'whats', 'who', 'dangerous', 'friendly', 'hostile', 'nice', 'mean', 'attack'] },
];

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
  const found = KINDS.filter((k) => (k.kind !== 'mine' || mining) && k.words.some((w) => words.includes(w)));
  return found.length ? found[0].kind : 'any';
}

// Which kinds of answer suit a question kind, best first. 'info' is a biome, enchantment, potion effect or topic.
export const FITS = {
  tame: ['guide'],
  drops: ['mob', 'fact'],
  mine: ['fact', 'guide'],
  find: ['guide', 'fact', 'recipe'],
  get: ['recipe', 'guide', 'fact'],
  make: ['recipe', 'guide', 'fact'],
  max: ['info'],
  food: ['fact', 'info'],
  weather: ['info'],
  about: ['mob', 'fact', 'info', 'recipe', 'guide'],
  any: ['recipe', 'guide', 'mob', 'fact', 'info'],
};

// Where an answer type sits in a question kind's list (lower is better), or -1 if it doesn't suit it.
export function fitIndex(kind, type) {
  return (FITS[kind] || FITS.any).indexOf(isInfo(type) ? 'info' : type);
}
