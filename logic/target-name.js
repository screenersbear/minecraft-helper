// Target names: the plain name of anything an answer can be about, for buttons and sentences.
import { isInfo, infoName } from './info.js';

// target: { type: 'item' | 'mob' | 'guide' | 'build' | 'place' | an info type, id }.
export function targetName(book, guides, target) {
  if (target.type === 'mob') return book.mobs[target.id]?.name || target.id;
  if (target.type === 'place') return book.places?.[target.id]?.name || target.id;
  if (isInfo(target.type)) return infoName(book, target);
  if (target.type === 'guide') return guides.find((g) => g.id === target.id)?.title || target.id;
  if (target.type === 'build') return book.builds?.find((b) => b.id === target.id)?.name || target.id;
  return book.items[target.id]?.name || target.id;
}

// What kind of answer it was, in words, for the grown-ups list: "Cake (recipe)".
const ANSWER_WORDS = {
  recipe: 'recipe', unpack: 'recipe', fact: 'facts', mob: 'mob card', guide: 'guide', build: 'build', where: 'where to find',
  biome: 'biome', enchant: 'enchantment', effect: 'potion effect', topic: 'food list',
};
export const answerLabel = (type, name) => (ANSWER_WORDS[type] ? `${name} (${ANSWER_WORDS[type]})` : name);
