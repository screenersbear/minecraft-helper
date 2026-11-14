// One fact: the answer to "where do you find an evoker" (#/where/mob:evoker) or "what gifts do cats bring"
// (#/field/mob:cat:gifts). The fact from where.json or fields.json with its words linked, the thing's picture, a
// guide when there is one, a button to the thing's own card, and Ask next buttons.
import { el } from '../components/el.js';
import { topBar } from '../components/top-bar.js';
import { answerHead } from '../components/answer-head.js';
import { targetPicture } from '../components/picture.js';
import { blockButton } from '../components/buttons.js';
import { answerFooter } from '../components/answer-footer.js';
import { linkedWords } from '../components/linked-text.js';
import { parseTarget, parseFieldKey } from '../logic/where.js';
import { fieldOf, FIELD_LABEL } from '../logic/fields.js';
import { plainText } from '../logic/links.js';
import { answerType } from '../logic/find-answer.js';
import { questionKind } from '../logic/understand.js';
import { toHash, backHash, hashForAnswer } from '../logic/routes.js';
import { targetName, answerLabel } from '../logic/target-name.js';

// The button to the thing's own card: how to make it, its facts, or what the mob is like.
const MORE = { recipe: 'How to make it', unpack: 'How to make it', fact: 'More facts', mob: 'More about it' };

// #/where/<target> is the where fact; #/field/<target>:<field> is any other.
function factOf(route) {
  if (route.page === 'where') return { target: parseTarget(route.id), field: 'where' };
  return parseFieldKey(route.id);
}

export function fieldPage(ctx, route) {
  const { book, guides } = ctx;
  const { target, field } = factOf(route) || {};
  const entry = target && fieldOf(book, target, field);
  if (!entry) return null;
  const name = targetName(book, guides, target);
  const say = plainText(entry.say);
  const kind = route.kind || questionKind(route.q);
  const guide = entry.guide && guides.find((g) => g.id === entry.guide);
  const type = answerType(target, book, guides);
  const small = (label, href) => blockButton({ label, tone: 'grey', href, extra: { class: 'block-btn notch tone-grey small-btn' } });
  const extras = [
    guide && [guide.title, toHash({ page: 'guide', id: guide.id, step: 1, q: route.q })],
    MORE[type] && [MORE[type], hashForAnswer({ type, target }, '')],
  ].filter(Boolean);
  const buttons = extras.map(([text, href]) => small(text, href));
  const label = field === 'where' ? answerLabel('where', name) : `${name} (${FIELD_LABEL[field].toLowerCase()})`;
  const footer = answerFooter(ctx, {
    feedback: { question: route.q, answer: label, target, say },
    follow: { topic: target, text: entry.say, here: location.hash, shown: extras.map(([, href]) => href) },
  });
  const heading = field === 'where' ? (kind === 'make' || kind === 'get' ? 'How to get it' : 'Where to find') : FIELD_LABEL[field];

  const nodes = [
    ...topBar({ left: { label: 'Back', href: backHash(route) }, right: heading }),
    el(
      'div',
      { class: 'page answer' },
      answerHead({ question: route.q, title: name, sentence: linkedWords(ctx, entry.say), onSay: () => ctx.say(say) }),
      el('div', { class: 'card-row' }, el('div', { class: 'panel' }, el('div', { class: 'slot big' }, targetPicture(book, guides, target, 96)))),
      buttons.length ? el('div', { class: 'another' }, buttons) : null,
      footer.node,
    ),
  ];
  return { nodes, say, title: name, cleanup: footer.stop, memory: footer.memory };
}
