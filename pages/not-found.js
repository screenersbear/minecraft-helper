// Not in the book: shown when nothing fits a question, and after "Not really". The question is already saved
// for the grown-ups list. Offers the closest answers as big buttons, plus "None of these".
import { el } from '../components/el.js';
import { icon } from '../components/icons.js';
import { topBar } from '../components/top-bar.js';
import { blockButton, pickButton } from '../components/buttons.js';
import { targetPicture, targetName } from '../components/picture.js';
import { findAnswer, answerType } from '../logic/find-answer.js';
import { hashForAnswer } from '../logic/routes.js';
import { askedLine } from '../logic/say.js';
import { listWords } from '../logic/plural.js';
import { logQuestion } from '../data/questions-log.js';

export function notFoundPage(ctx, route) {
  const { book, guides, list } = ctx;
  const afterNotReally = route.id === 'not-really';
  const q = route.q;
  const picks = q ? findAnswer(q, list, book, guides).suggestions.filter((t) => answerType(t, book, guides)) : [];
  const names = picks.map((t) => targetName(book, guides, t));

  const bottom = el('div', { class: 'bottom' });
  const askAgain = () => blockButton({ label: 'Ask something else', tone: 'mango', href: '#/' });
  if (picks.length) {
    bottom.append(
      blockButton({
        label: 'None of these',
        tone: 'mango',
        onClick: () => {
          logQuestion(q, 'none-of-these');
          bottom.replaceChildren(el('p', { class: 'feedback-q', role: 'status' }, 'Okay! A grown-up can add it to the book.'), askAgain());
          ctx.say('Okay! A grown-up can add it to the book.');
        },
      }),
    );
  } else {
    bottom.append(askAgain());
  }

  const heading = afterNotReally ? ['Sorry about', el('br'), 'that'] : ['Not in my', el('br'), 'book yet'];
  const first = afterNotReally ? "Sorry about that. I saved your question so a better answer can be added." : "That's not in my book yet. I saved your question.";
  const say = picks.length ? `${first} Did you mean ${listWords(names, 'or')}?` : first;

  const nodes = [
    ...topBar({ left: { label: 'Back', href: '#/' }, right: 'Not in the book' }),
    el(
      'div',
      { class: 'page none' },
      el('div', { class: 'answer-head' }, q ? el('p', { class: 'small-label' }, askedLine(q)) : null, el('h1', { class: 'none-title', tabindex: '-1' }, heading)),
      el('div', { class: 'saved-banner' }, icon('check', 28), el('p', {}, 'I saved your question so it can be added to the book.')),
      picks.length ? el('p', { class: 'say' }, 'Did you mean one of these?') : null,
      picks.length
        ? el(
            'div',
            { class: 'picks' },
            picks.map((t) =>
              pickButton({
                picture: targetPicture(book, guides, t, 32),
                label: targetName(book, guides, t),
                onClick: () => ctx.go(hashForAnswer({ type: answerType(t, book, guides), target: t }, q)),
              }),
            ),
          )
        : null,
      bottom,
    ),
  ];
  return { nodes, say, title: 'Not in the book' };
}
