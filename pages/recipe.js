// Recipe answer: how to make something. The grid in slots, what you need, and "Did that answer it?".
// Things with more than one recipe get an "Another way" button.
import { el } from '../components/el.js';
import { topBar } from '../components/top-bar.js';
import { answerHead } from '../components/answer-head.js';
import { recipeView } from '../components/slots.js';
import { needsList } from '../components/thing-list.js';
import { blockButton } from '../components/buttons.js';
import { feedbackArea } from '../components/feedback-area.js';
import { recipeSentence, backSentence } from '../logic/say.js';
import { toHash, backHash } from '../logic/routes.js';

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
          extra: { class: 'block-btn notch tone-grey small-btn' },
        })
      : null;

  const nodes = [
    ...topBar({ left: { label: 'Back', href: backHash(route) }, right: WHERE[recipe.how] }),
    el(
      'div',
      { class: 'page answer' },
      answerHead({ question: route.q, title: item.name, sentence: main, onSay: () => ctx.say(say) }),
      recipeView(book, recipe, route.id),
      needsList(book, recipe),
      back ? el('p', { class: 'note' }, back) : null,
      recipe.maybeDifferent ? el('p', { class: 'note' }, 'Check this one in the game. It might be a little different in your game.') : null,
      another ? el('div', { class: 'another' }, another) : null,
      feedbackArea(ctx, route.q, item.name),
    ),
  ];
  return { nodes, say, title: item.name };
}
