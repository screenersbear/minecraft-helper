// Say, for the newer facts: biomes, enchantments, potion effects and food. Short and plain, made only from the book.
import { capitalize } from './plural.js';

// "Taiga" -> "the taiga", "Nether Wastes" -> "the Nether wastes", "The End" -> "the End".
export function placeName(name) {
  const lower = name.toLowerCase().replace(/\bnether\b/, 'Nether');
  if (lower === 'the end') return 'the End';
  return lower.startsWith('the ') ? lower : `the ${lower}`;
}

// "on the beach", "in the taiga".
const at = (place) => `${/(beach|shore)$/.test(place) ? 'on' : 'in'} ${place}`;

const WEATHER = {
  dry: (place) => `It never rains or snows ${at(place)}.`,
  snow: (place) => `It snows ${at(place)}.`,
  'rain-snow-high': (place) => `It rains ${at(place)}. Way up high, it snows instead.`,
  rain: (place) => `It rains ${at(place)}, but it never snows.`,
  cave: (place, name) => `${capitalize(place)} ${/s$/.test(name) ? 'are' : 'is'} under the ground, so rain and snow can't get there.`,
};
const WORLD = { nether: 'the Nether', end: 'the End' };

export function biomeSentence(id, book) {
  const biome = book.biomes[id];
  const place = placeName(biome.name);
  const parts = [WEATHER[biome.weather](place, biome.name)];
  const snowy = book.biomes[biome.snowy];
  if (snowy && biome.weather !== 'snow') parts.push(`${capitalize(at(placeName(snowy.name)))}, it snows.`);
  const world = WORLD[biome.world];
  if (world && !place.includes(world.slice(4))) parts.push(`It's in ${world}.`);
  return parts.join(' ');
}

// kind: the question kind. A "max" question ("how high does sharpness go") hears the level first.
export function enchantSentence(id, book, kind) {
  const e = book.enchants[id];
  const levels = e.max > 1 ? `It goes up to level ${e.max}.` : 'It has just one level.';
  const parts = kind === 'max' ? [`${e.name} goes up to level ${e.max}.`, `It goes on ${e.on}.`] : [`${e.name} goes on ${e.on}.`, e.what, levels];
  if (e.treasure && kind !== 'max') parts.push("You can't get it from an enchanting table. Look in chests, or trade for it.");
  return parts.join(' ');
}

const lowerFirst = (text) => text[0].toLowerCase() + text.slice(1);

export function effectSentence(id, book) {
  const e = book.effects[id];
  return `${e.name} is a ${e.good ? 'good' : 'bad'} effect: ${lowerFirst(e.what)}`;
}

// Points are half drumsticks on the hunger bar: 8 -> "4 drumsticks", 5 -> "2 and a half drumsticks", 1 -> "half a drumstick".
export function drumsticks(points) {
  if (points <= 1) return 'half a drumstick';
  const whole = Math.floor(points / 2);
  const half = points % 2 ? ' and a half' : '';
  return `${whole}${half} drumstick${whole === 1 && !half ? '' : 's'}`;
}

export function foodSentence(food) {
  const keeps = food.full === 'long' && !/full/.test(food.note || '') ? ' and keeps you full a long time' : '';
  const soon = food.full === 'short' && !/hungry/.test(food.note || '') ? ", but you'll be hungry again soon" : '';
  return [`It fills ${drumsticks(food.points)} on your hunger bar${keeps}${soon}.`, food.note].filter(Boolean).join(' ');
}
