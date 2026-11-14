// Missing answers: the app knows the thing but not that kind of answer yet ("what gifts?" about a horse). It says
// so plainly, "I don't know that about horses yet", and the grown-ups list says exactly what's missing:
// "Missing: horse, what gifts".
import { plural, mobPlural } from './plural.js';
import { mobSentence, factSentence, recipeSentence } from './say.js';
import { whereOf } from './where.js';
import { cleanText } from './words.js';

// "I don't know that about pandas yet." type: the thing's type ('mob', 'item' or 'place').
export function missingSentence(name, type = 'item') {
  const many = type === 'mob' ? mobPlural(name) : plural(name);
  return `I don't know that about ${many} yet.`;
}

// For the grown-ups list: "Missing: cat, what gifts". question: as the kid asked it. kind: said instead, if the
// question is empty.
export function missingLabel(name, question, kind = '') {
  return `Missing: ${String(name).toLowerCase()}, ${cleanText(question) || kind || 'something'}`;
}

// What the app does know about a thing, for the missing screen: its mob card, facts, recipe or where line (a where
// line keeps its links). type: answerType(target) for any kind of question.
export function knownSentence(target, type, book, name) {
  if (type === 'mob') return mobSentence(target.id, book);
  if (type === 'fact') return factSentence(target.id, book);
  if (type === 'where') return whereOf(book, target)?.say || '';
  if (type === 'recipe' || type === 'unpack') {
    const recipes = book.recipes[target.id] || [];
    const recipe = recipes.find((r) => !r.unpack) || recipes[0];
    return recipe ? recipeSentence(recipe, name, book) : '';
  }
  return '';
}
