// Info answers: biomes, enchantments, potion effects and topics ("the best food"). Each lives in its own part of
// the book, and each has a name and a picture (an item id) to show.

export const INFO_TYPES = ['biome', 'enchant', 'effect', 'topic'];
const PART = { biome: 'biomes', enchant: 'enchants', effect: 'effects', topic: 'topics' };

export const isInfo = (type) => INFO_TYPES.includes(type);

// The book's entry for a target like { type: 'biome', id: 'taiga' }, or null.
export function infoOf(book, target) {
  if (!target || !isInfo(target.type)) return null;
  return book[PART[target.type]]?.[target.id] || null;
}

// The name to show: a biome's name, or a topic's title.
export function infoName(book, target) {
  const info = infoOf(book, target);
  return info ? info.name || info.title : target.id;
}
