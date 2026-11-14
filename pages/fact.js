// Fact answer: for things you find instead of craft (diamonds, gunpowder) and for "what do I mine X with".
import { el } from '../components/el.js';
import { topBar } from '../components/top-bar.js';
import { answerHead } from '../components/answer-head.js';
import { thingList } from '../components/thing-list.js';
import { itemPicture, mobPicture } from '../components/picture.js';
import { blockButton } from '../components/buttons.js';
import { feedbackArea } from '../components/feedback-area.js';
import { factSentence } from '../logic/say.js';
import { plural } from '../logic/plural.js';
import { questionKind } from '../logic/understand.js';
import { toHash } from '../logic/routes.js';

function whereRows(book, fact) {
  const blocks = (fact.fromBlocks || []).map((b) => ({
    picture: itemPicture(book, b.block, 24),
    text: book.items[b.block]?.name || b.block,
    note: b.sometimes ? 'sometimes' : '',
  }));
  const mobs = (fact.fromMobs || []).map((m) => ({ picture: mobPicture(book, m, 24), text: plural(book.mobs[m]?.name || m) }));
  return [...blocks, ...mobs];
}

export function factPage(ctx, route) {
  const { book } = ctx;
  const fact = book.facts[route.id];
  const item = book.items[route.id];
  if (!fact || !item) return null;
  const kind = questionKind(route.q);
  const say = factSentence(route.id, book, kind);
  const tool = fact.mineWith
    ? [{ picture: itemPicture(book, fact.mineWith, 24), text: book.items[fact.mineWith]?.name || fact.mineWith, note: fact.mineWith === 'wooden_pickaxe' ? 'or any pickaxe' : 'or better' }]
    : [];
  const canMake = (book.recipes[route.id] || []).length > 0;

  const nodes = [
    ...topBar({ left: { label: 'Back', href: '#/' }, right: kind === 'mine' ? 'Mining' : 'Facts' }),
    el(
      'div',
      { class: 'page answer' },
      answerHead({ question: route.q, title: item.name, sentence: say, onSay: () => ctx.say(say) }),
      el('div', { class: 'card-row' }, el('div', { class: 'panel' }, el('div', { class: 'slot big' }, itemPicture(book, route.id, 96)))),
      thingList(whereRows(book, fact), 'Where to get it'),
      thingList(tool, 'Mine it with'),
      canMake
        ? el('div', { class: 'another' }, blockButton({ label: 'How to make it', tone: 'grey', href: toHash({ page: 'recipe', id: route.id, q: route.q }), extra: { class: 'block-btn notch tone-grey small-btn' } }))
        : null,
      feedbackArea(ctx, route.q, item.name),
    ),
  ];
  return { nodes, say, title: item.name };
}
