// Where to find: the answer to "where do you find an evoker". One line from where.json about where a mob, an item
// or a place is, its picture, a guide when there is one, and a button to the thing's own card.
import { el } from '../components/el.js';
import { topBar } from '../components/top-bar.js';
import { answerHead } from '../components/answer-head.js';
import { targetPicture } from '../components/picture.js';
import { blockButton } from '../components/buttons.js';
import { answerFooter } from '../components/answer-footer.js';
import { whereOf, parseTarget } from '../logic/where.js';
import { answerType } from '../logic/find-answer.js';
import { questionKind } from '../logic/understand.js';
import { toHash, backHash, hashForAnswer } from '../logic/routes.js';
import { targetName, answerLabel } from '../logic/target-name.js';

// The button to the thing's own card: how to make it, its facts, or what the mob is like.
const MORE = { recipe: 'How to make it', unpack: 'How to make it', fact: 'More facts', mob: 'More about it' };

export function wherePage(ctx, route) {
  const { book, guides } = ctx;
  const target = parseTarget(route.id);
  const entry = whereOf(book, target);
  if (!entry) return null;
  const name = targetName(book, guides, target);
  const say = entry.say;
  const kind = route.kind || questionKind(route.q);
  const guide = entry.guide && guides.find((g) => g.id === entry.guide);
  const type = answerType(target, book, guides);
  const small = (label, href) => blockButton({ label, tone: 'grey', href, extra: { class: 'block-btn notch tone-grey small-btn' } });
  const buttons = [
    guide ? small(guide.title, toHash({ page: 'guide', id: guide.id, step: 1, q: route.q })) : null,
    MORE[type] ? small(MORE[type], hashForAnswer({ type, target }, '')) : null,
  ].filter(Boolean);
  const footer = answerFooter(ctx, { feedback: { question: route.q, answer: answerLabel('where', name), target, say } });

  const nodes = [
    ...topBar({ left: { label: 'Back', href: backHash(route) }, right: kind === 'make' || kind === 'get' ? 'How to get it' : 'Where to find' }),
    el(
      'div',
      { class: 'page answer' },
      answerHead({ question: route.q, title: name, sentence: say, onSay: () => ctx.say(say) }),
      el('div', { class: 'card-row' }, el('div', { class: 'panel' }, el('div', { class: 'slot big' }, targetPicture(book, guides, target, 96)))),
      buttons.length ? el('div', { class: 'another' }, buttons) : null,
      footer.node,
    ),
  ];
  return { nodes, say, title: name, cleanup: footer.stop };
}
