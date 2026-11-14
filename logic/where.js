// Where to find things, and how a thing (or one fact about it) is written in the address:
// "mob:evoker", "item:diamond", "place:village", and "mob:cat:gifts" for one fact.
import { fieldOf, FIELDS } from './fields.js';

const TYPES = new Set(['mob', 'item', 'place']);

export const targetKey = (target) => `${target.type}:${target.id}`;
export const fieldKey = (target, field) => `${target.type}:${target.id}:${field}`;

// "mob:evoker" -> { type: 'mob', id: 'evoker' }, or null if it isn't one.
export function parseTarget(text) {
  const [type, id] = String(text || '').split(':');
  return TYPES.has(type) && id ? { type, id } : null;
}

// "mob:cat:gifts" -> { target: { type: 'mob', id: 'cat' }, field: 'gifts' }, or null.
export function parseFieldKey(text) {
  const target = parseTarget(text);
  const field = String(text || '').split(':')[2];
  return target && FIELDS.includes(field) ? { target, field } : null;
}

// The where line for a target: { say, guide?, build? }, plus name and pic for a place. Or null.
export const whereOf = (book, target) => fieldOf(book, target, 'where');
