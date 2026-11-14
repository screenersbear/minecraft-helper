// Ingredient links: tapping a thing in a crafting grid opens how to get that thing.
import { answerType, findAnswer } from './find-answer.js';
import { hashForAnswer } from './routes.js';

// cell: a recipe cell: "sugar", "coal|charcoal" (the first is used), or "@planks" (any planks: found by its name,
// "wood planks"). from: the page Back should return to, like "recipe/cake". Returns the address, or '' if none.
export function ingredientHash(cell, { book, guides, list }, from = '') {
  const first = String(cell || '').split('|')[0];
  if (!first) return '';
  let answer = null;
  if (first.startsWith('@')) answer = findAnswer(book.items[first]?.name || '', list, book, guides);
  else {
    const target = { type: 'item', id: first };
    const type = answerType(target, book, guides);
    if (type) answer = { type, target };
  }
  if (!answer || answer.type === 'none' || answer.type === 'missing') return '';
  const hash = hashForAnswer(answer, '');
  return from ? `${hash}${hash.includes('?') ? '&' : '?'}from=${encodeURIComponent(from)}` : hash;
}
