// Missing answers: the app knows the thing but not that kind of answer yet ("where do pandas live" before there
// was a where line for pandas). It says so plainly, and the grown-ups list says exactly what's missing.
import { plural, mobPlural } from './plural.js';
import { mobSentence, factSentence, recipeSentence } from './say.js';
import { whereOf } from './where.js';

// For each kind of question: how to say it about "them", and how to say it about one thing by name.
const ASKED = {
  find: ['where to find them', (n) => `where to find ${n}`],
  get: ['how to get them', (n) => `how to get ${n}`],
  make: ['how to make them', (n) => `how to make ${n}`],
  drops: ['what they drop', (n) => `what ${n} drops`],
  tame: ['how to tame or breed them', (n) => `how to tame or breed ${n}`],
  mine: ['how to mine them', (n) => `how to mine ${n}`],
  food: ['if you can eat them', (n) => `if you can eat ${n}`],
  eats: ['what they eat', (n) => `what ${n} eats`],
  danger: ["if they're dangerous", (n) => `if ${n} is dangerous`],
  does: ['what they do', (n) => `what ${n} does`],
  max: ['how high they go', (n) => `how high ${n} goes`],
  weather: ['what the weather is like there', (n) => `the weather in ${n}`],
};
const OTHER = ['that about them', (n) => `that about ${n}`];

// "I know about pandas, but I don't know what they eat yet." type: the thing's type ('mob', 'item' or 'place').
export function missingSentence(name, kind, type = 'item') {
  const many = type === 'mob' ? mobPlural(name) : plural(name);
  return `I know about ${many}, but I don't know ${(ASKED[kind] || OTHER)[0]} yet.`;
}

// For the grown-ups list: "Missing: where to find evoker".
export function missingLabel(name, kind) {
  return `Missing: ${(ASKED[kind] || OTHER)[1](String(name).toLowerCase())}`;
}

// What the app does know about a thing, for the missing screen: its mob card, facts, recipe or where line.
// type: answerType(target) for any kind of question.
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
