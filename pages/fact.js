// Fact answer: for things you find instead of craft (diamonds, gunpowder) and for "what do I mine X with".
import { el } from '../components/el.js';
import { topBar } from '../components/top-bar.js';
import { answerHead } from '../components/answer-head.js';
import { thingList } from '../components/thing-list.js';
import { itemPicture, mobPicture } from '../components/picture.js';
import { blockButton } from '../components/buttons.js';
import { answerFooter } from '../components/answer-footer.js';
import { factSentence } from '../logic/say.js';
import { drumsticks } from '../logic/say-facts.js';
import { mobPlural } from '../logic/plural.js';
import { questionKind } from '../logic/understand.js';
import { toHash, backHash } from '../logic/routes.js';
import { answerLabel } from '../logic/target-name.js';

function whereRows(book, fact) {
  const blocks = (fact.fromBlocks || []).map((b) => ({
    picture: itemPicture(book, b.block, 24),
    text: book.items[b.block]?.name || b.block,
    note: b.sometimes ? 'sometimes' : '',
  }));
  const mobs = (fact.fromMobs || []).map((m) => ({ picture: mobPicture(book, m, 24), text: mobPlural(book.mobs[m]?.name || m) }));
  return [...blocks, ...mobs];
}

// How much it fills, for food.
function foodRows(book, id, food) {
  if (!food) return [];
  const note = { long: 'keeps you full', short: 'not for long' }[food.full] || '';
  return [{ picture: itemPicture(book, id, 24), text: `Fills ${drumsticks(food.points)}`, note }];
}

const LABEL = { mine: 'Mining', food: 'Food' };

export function factPage(ctx, route) {
  const { book } = ctx;
  const fact = book.facts[route.id];
  const item = book.items[route.id];
  if (!fact || !item) return null;
  const kind = route.kind || questionKind(route.q);
  const say = factSentence(route.id, book, kind);
  const tool = fact.mineWith
    ? [{ picture: itemPicture(book, fact.mineWith, 24), text: book.items[fact.mineWith]?.name || fact.mineWith, note: fact.mineWith === 'wooden_pickaxe' ? 'or any pickaxe' : 'or better' }]
    : [];
  const canMake = (book.recipes[route.id] || []).length > 0;
  const target = { type: 'item', id: route.id };
  const small = (label, href) => blockButton({ label, tone: 'grey', href, extra: { class: 'block-btn notch tone-grey small-btn' } });
  const more = [
    canMake ? small('How to make it', toHash({ page: 'recipe', id: route.id, q: route.q, from: route.from })) : null,
  ].filter(Boolean);
  const footer = answerFooter(ctx, { feedback: { question: route.q, answer: answerLabel('fact', item.name), target, say }, follow: { topic: target, here: location.hash } });

  const nodes = [
    ...topBar({ left: { label: 'Back', href: backHash(route) }, right: LABEL[kind] || (fact.food && !fact.fromBlocks && !fact.fromMobs ? 'Food' : 'Facts') }),
    el(
      'div',
      { class: 'page answer' },
      answerHead({ question: route.q, title: item.name, sentence: say, onSay: () => ctx.say(say) }),
      el('div', { class: 'card-row' }, el('div', { class: 'panel' }, el('div', { class: 'slot big' }, itemPicture(book, route.id, 96)))),
      kind === 'food' ? thingList(foodRows(book, route.id, fact.food), 'Food') : null,
      thingList(whereRows(book, fact), 'Where to get it'),
      thingList(tool, 'Mine it with'),
      kind !== 'food' ? thingList(foodRows(book, route.id, fact.food), 'Food') : null,
      more.length ? el('div', { class: 'another' }, more) : null,
      footer.node,
    ),
  ];
  return { nodes, say, title: item.name, cleanup: footer.stop, memory: footer.memory };
}
