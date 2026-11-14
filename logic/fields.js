// Fields: the facts the app knows about a mob or an item, each in its own named slot, so a follow-up like
// "what gifts?" finds exactly that fact. Each is one or two short sentences, checked against the Minecraft Wiki,
// from tools/book/where.json (where) and tools/book/fields.json (the rest). Places only have where.

export const FIELDS = ['where', 'eats', 'tame', 'breed', 'gifts', 'dangerous', 'uses'];

// The words in the top bar of a fact's screen.
export const FIELD_LABEL = {
  where: 'Where to find', eats: 'Food', tame: 'Taming', breed: 'Breeding', gifts: 'Gifts', dangerous: 'Danger', uses: 'What it does',
};

// Which field answers each kind of question: "what do pandas eat" -> eats, "are creepers dangerous" -> dangerous.
const KIND_FIELD = { find: 'where', eats: 'eats', tame: 'tame', breed: 'breed', gifts: 'gifts', danger: 'dangerous', does: 'uses' };
// The other way round: the kind of question a field answers ('dangerous' -> 'danger').
export const kindOfField = (field) => Object.keys(KIND_FIELD).find((kind) => KIND_FIELD[kind] === field) || '';

// The facts every thing of its sort should have: where every mob lives, how dangerous a mob that fights is, and
// what an item is for (food is for eating, so not food). When the book doesn't have one yet, its button still shows
// (see chips.js).
export function expectedFacts(book, target) {
  if (target?.type === 'mob') return book.mobs[target.id]?.kind === 'passive' ? ['where'] : ['where', 'dangerous'];
  if (target?.type === 'item') return book.facts?.[target.id]?.food || book.categories?.food?.includes(target.id) ? [] : ['uses'];
  return [];
}

export function fieldForKind(kind, target) {
  if (kind === 'food' && target?.type === 'mob') return 'eats';
  return KIND_FIELD[kind] || null;
}

// One fact: { say, guide?, build? }, or null.
export function fieldOf(book, target, field) {
  if (!target) return null;
  if (target.type === 'place') return field === 'where' ? book.places?.[target.id] || null : null;
  return book.fields?.[target.type]?.[target.id]?.[field] || null;
}

// The fields a thing has, in the usual order.
export const fieldsOf = (book, target) => FIELDS.filter((f) => fieldOf(book, target, f));
