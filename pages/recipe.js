// Recipe answer: how to make something. The grid in slots (tap a thing in it to see how to get that), what you
// need, "Did that answer it?" and a button to ask more. Things with more than one recipe get an "Another way" button.
import { el } from '../components/el.js';
import { topBar } from '../components/top-bar.js';
import { answerHead } from '../components/answer-head.js';
import { recipeView } from '../components/slots.js';
import { needsList } from '../components/thing-list.js';
import { blockButton } from '../components/buttons.js';
import { answerFooter } from '../components/answer-footer.js';
import { recipeSentence, backSentence } from '../logic/say.js';
import { toHash, backHash } from '../logic/routes.js';
import { ingredientHash } from '../logic/ingredient-link.js';
import { answerLabel } from '../logic/target-name.js';

const WHERE = { crafting: 'Crafting', furnace: 'Furnace', stonecutter: 'Stonecutter', smithing: 'Smithing' };

export function recipePage(ctx, route) {
  const { book } = ctx;
  const ways = book.recipes[route.id];
  const item = book.items[route.id];
  if (!ways?.length || !item) return null;
  const way = Math.min(Math.max(route.way, 0), ways.length - 1);
  const recipe = ways[way];
  const main = recipeSentence(recipe, item.name, book);
  const back = backSentence(recipe, book);
  const say = [main, back].filter(Boolean).join(' ');

  const another =
    ways.length > 1
      ? blockButton({
          label: `Another way (${way + 1} of ${ways.length})`,
          tone: 'grey',
          onClick: () => ctx.go(toHash({ page: 'recipe', id: route.id, q: route.q, from: route.from, way: (way + 1) % ways.length }), { replace: true }),
          extra: { class: 'block-btn tone-grey small-btn' },
        })
      : null;

  const target = { type: 'item', id: route.id };
  const footer = answerFooter(ctx, { feedback: { question: route.q, answer: answerLabel('recipe', item.name), target, say }, follow: { topic: target, here: location.hash } });
  const linkFor = (cell) => (cell.split('|')[0] === route.id ? '' : ingredientHash(cell, ctx, `recipe/${route.id}`));

  const nodes = [
    ...topBar({ back: backHash(route), right: WHERE[recipe.how] }, ctx),
    el(
      'div',
      { class: 'page answer' },
      answerHead({ question: route.q, title: item.name, sentence: main, onSay: () => ctx.say(say) }),
      recipeView(book, recipe, route.id, linkFor),
      el('p', { class: 'small-label tap-hint' }, 'Tap a block to see how to get it.'),
      needsList(book, recipe),
      back ? el('p', { class: 'note' }, back) : null,
      recipe.maybeDifferent ? el('p', { class: 'note' }, 'Check this one in the game. It might be a little different in your game.') : null,
      another ? el('div', { class: 'another' }, another) : null,
      footer.node,
    ),
  ];
  return { nodes, say, title: item.name, cleanup: footer.stop, memory: footer.memory };
}
