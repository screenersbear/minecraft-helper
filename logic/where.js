// Where to find things: a line from where.json for a mob or an item, or a place (a village, a stronghold).
// In the address a thing is written as its type and id: "mob:evoker", "item:diamond", "place:village".

const TYPES = new Set(['mob', 'item', 'place']);

export const targetKey = (target) => `${target.type}:${target.id}`;

// "mob:evoker" -> { type: 'mob', id: 'evoker' }, or null if it isn't one.
export function parseTarget(text) {
  const [type, id] = String(text || '').split(':');
  return TYPES.has(type) && id ? { type, id } : null;
}

// The where line for a target: { say, guide?, build? }, plus name and pic for a place. Or null.
export function whereOf(book, target) {
  if (!target) return null;
  if (target.type === 'place') return book.places?.[target.id] || null;
  return book.where?.[target.type]?.[target.id] || null;
}
