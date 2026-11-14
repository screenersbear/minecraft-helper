// Plural: "3 milk buckets", "2 sugar", "1 egg", "4 torches". Also "a" or "an", and lists like "a, b and c".

// Last words that don't take an s ("2 sugar", "3 cobblestone").
const SAME = new Set(
  (
    'sugar wheat gunpowder dust glass sand gravel clay string leather paper coal charcoal flint meal lazuli snow ice dirt ' +
    'cobblestone stone obsidian netherrack wool powder redstone kelp wart slime honey quartz prismarine deepslate blackstone ' +
    'basalt andesite diorite granite tuff calcite mud moss terracotta concrete scaffolding bamboo cactus cane fish cod salmon ' +
    'pufferfish sheep beef mutton chicken rabbit porkchop iron gold copper netherite amethyst sculk resin dripstone glowstone ' +
    'magma lava water milk end purpur popcorn bread cake stew soup flesh'
  ).split(' '),
);
const SPECIAL = { drowned: 'drowned', leaf: 'leaves', wolf: 'wolves', loaf: 'loaves', foot: 'feet', enderman: 'endermen', knife: 'knives', shelf: 'shelves' };

function pluralWord(word) {
  if (SPECIAL[word]) return SPECIAL[word];
  if (SAME.has(word) || word.endsWith('s')) return word;
  if (/(ch|sh|x)$/.test(word)) return `${word}es`;
  if (/[^aeiou]y$/.test(word)) return `${word.slice(0, -1)}ies`;
  return `${word}s`;
}

// "Eye of Ender" -> "eyes of ender": the word before "of" is the one that changes.
export function plural(name, count = 2) {
  const lower = String(name).toLowerCase();
  if (count === 1) return lower.replace(/\bplanks$/, 'plank');
  const of = lower.match(/^(.+?) (of|o) (.+)$/);
  if (of) return `${plural(of[1])} ${of[2]} ${of[3]}`;
  const words = lower.split(' ');
  words[words.length - 1] = pluralWord(words[words.length - 1]);
  return words.join(' ');
}

// Mobs named like a food: "chickens", not "chicken" as in "2 raw chicken".
const MOBS = { chicken: 'chickens', rabbit: 'rabbits', cod: 'cod', salmon: 'salmon' };
export const mobPlural = (name) => MOBS[String(name).toLowerCase()] || plural(name);

// "3 milk buckets"
export const counted = (count, name) => `${count} ${plural(name, count)}`;

// "a sword", "an egg"
export function article(name) {
  const lower = String(name).toLowerCase();
  return `${/^[aeiou]/.test(lower) ? 'an' : 'a'} ${lower}`;
}

// "a", "a and b", "a, b and c". joiner: "or" gives "a, b or c".
export function listWords(items, joiner = 'and') {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} ${joiner} ${items[items.length - 1]}`;
}

// "Creepers" from "creeper": for sentences about mobs.
export function capitalize(text) {
  return text ? text[0].toUpperCase() + text.slice(1) : text;
}
