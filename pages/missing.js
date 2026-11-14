// Missing: the app knows the thing, but not this kind of answer yet ("what gifts?" about a horse). It says "I don't
// know that about horses yet", then shows what it does know. The question is already saved for the grown-ups list
// as "Missing: horse, what gifts".
import { el } from '../components/el.js';
import { topBar } from '../components/top-bar.js';
import { answerHead } from '../components/answer-head.js';
import { targetPicture } from '../components/picture.js';
import { blockButton } from '../components/buttons.js';
import { answerFooter } from '../components/answer-footer.js';
import { parseTarget } from '../logic/where.js';
import { answerType } from '../logic/find-answer.js';
import { backHash, hashForAnswer } from '../logic/routes.js';
import { targetName } from '../logic/target-name.js';
import { missingSentence, knownSentence } from '../logic/say-missing.js';
import { plainText } from '../logic/links.js';
import { linkedText } from '../components/linked-text.js';

export function missingPage(ctx, route) {
  const { book, guides } = ctx;
  const target = parseTarget(route.id);
  const type = target && answerType(target, book, guides);
  if (!type) return null;
  const name = targetName(book, guides, target);
  const first = missingSentence(name, target.type);
  const known = knownSentence(target, type, book, name);
  const say = known ? `${first} Here's what I know. ${plainText(known)}` : first;
  const footer = answerFooter(ctx, { follow: { topic: target, text: known, here: location.hash } });

  const nodes = [
    ...topBar({ left: { label: 'Back', href: backHash(route) }, right: 'Not yet' }),
    el(
      'div',
      { class: 'page answer missing' },
      answerHead({ question: route.q, title: name, sentence: first, onSay: () => ctx.say(say) }),
      el('h2', { class: 'small-label known-label' }, "Here's what I know"),
      el('div', { class: 'card-row' }, el('div', { class: 'panel' }, el('div', { class: 'slot big' }, targetPicture(book, guides, target, 96)))),
      known ? linkedText(ctx, known) : null,
      el('div', { class: 'another' }, blockButton({ label: 'All about it', tone: 'grey', href: hashForAnswer({ type, target }, ''), extra: { class: 'block-btn notch tone-grey small-btn' } })),
      footer.node,
    ),
  ];
  return { nodes, say, title: name, cleanup: footer.stop, memory: footer.memory };
}
