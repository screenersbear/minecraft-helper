// Feedback: "Did that answer it?" at the bottom of an answer, shown only once the answer has been read out, so a
// kid can't tap it by accident while listening. Not really saves the moment for the grown-ups list (with an Undo
// for 5 seconds) and asks what was wrong: That's wrong, I didn't understand (offers to say it more simply),
// Not what I asked (offers other answers), or Oops, wrong button (takes it back).
import { el } from './el.js';
import { blockButton, pickButton } from './buttons.js';
import { targetPicture, targetName } from './picture.js';
import { logQuestion, updateQuestion, undoQuestion } from '../data/questions-log.js';
import { speakSlowly } from '../speech/speak.js';
import { findAnswer, answerType } from '../logic/find-answer.js';
import { hashForAnswer } from '../logic/routes.js';

const UNDO_FOR = 5000;

const status = (text) => el('p', { class: 'feedback-q', role: 'status' }, text);
const sameTarget = (a, b) => Boolean(a && b) && a.type === b.type && a.id === b.id;

// Other answers the question might have meant, for "Not what I asked".
function otherAnswers(ctx, question, target) {
  if (!question) return [];
  const { book, guides, list } = ctx;
  return findAnswer(question, list, book, guides).suggestions.filter((t) => answerType(t, book, guides) && !sameTarget(t, target));
}

// question: what was asked (empty if the answer was opened by tapping). answer: what was shown, like "Cake (recipe)".
// target: what the answer is about. say: the answer's words, to say again more simply.
// waitForAnswer: show it once the app has finished reading the answer (the 'answer-spoken' event). With false, it
// stays hidden until the page calls show().
export function feedbackArea(ctx, { question = '', answer = '', target = null, say = '', waitForAnswer = true }) {
  const box = el('section', { class: 'feedback is-waiting', 'aria-label': 'Did that answer it?', inert: '' });
  const q = question || answer;
  let saved = null; // what Undo needs, once Not really saved the moment
  let undoTimer = 0;

  const show = () => {
    box.classList.remove('is-waiting');
    box.removeAttribute('inert');
  };
  const ask = () => {
    clearTimeout(undoTimer);
    box.replaceChildren(
      el('p', { class: 'feedback-q' }, 'Did that answer it?'),
      el('div', { class: 'two-up' }, blockButton({ label: 'Yes!', tone: 'green', onClick: yes }), blockButton({ label: 'Not really', tone: 'mango', onClick: notReally })),
    );
  };
  const takeBack = () => {
    undoQuestion(saved);
    saved = null;
    ask();
    ctx.say('Okay!');
  };
  function yes() {
    box.replaceChildren(status('Great! Ask me anything else.'));
    ctx.say('Great!');
  }
  function notReally() {
    saved = logQuestion({ q, answer, reason: 'not-really' });
    const undoRow = el('div', { class: 'undo-row' }, el('span', {}, 'Saved for a grown-up.'), el('button', { class: 'undo-btn', type: 'button', onclick: takeBack }, 'Undo'));
    const why = (label, reason, tone = 'grey') => blockButton({ label, tone, onClick: () => because(reason) });
    box.replaceChildren(
      el('p', { class: 'feedback-q' }, 'What was wrong?'),
      el('div', { class: 'why-grid' }, why("That's wrong", 'wrong'), why("I didn't understand", 'hard'), why('Not what I asked', 'not-asked'), why('Oops, wrong button', 'oops')),
      undoRow,
    );
    undoTimer = setTimeout(() => undoRow.remove(), UNDO_FOR);
    ctx.say('What was wrong?');
  }
  function because(reason) {
    clearTimeout(undoTimer);
    if (reason === 'oops') return takeBack();
    updateQuestion(saved.key, { reason });
    if (reason === 'wrong') {
      box.replaceChildren(status('Thanks for telling me. I saved it so a grown-up can check the answer.'));
      return ctx.say('Thanks for telling me. I saved it so a grown-up can check the answer.');
    }
    if (reason === 'hard') {
      const again = blockButton({ label: 'Say it more simply', tone: 'mango', onClick: () => speakSlowly(say) });
      box.replaceChildren(...[status('Thanks. Want me to say it more simply?'), say && again].filter(Boolean));
      return ctx.say('Thanks. Want me to say it more simply?');
    }
    const others = otherAnswers(ctx, question, target);
    const picks = others.map((t) =>
      pickButton({
        picture: targetPicture(ctx.book, ctx.guides, t, 32),
        label: targetName(ctx.book, ctx.guides, t),
        onClick: () => ctx.go(hashForAnswer({ type: answerType(t, ctx.book, ctx.guides), target: t }, question)),
      }),
    );
    const line = others.length ? 'Thanks. Did you mean one of these?' : 'Thanks. I saved it. Try asking it another way.';
    box.replaceChildren(...[status(line), picks.length && el('div', { class: 'picks' }, picks)].filter(Boolean));
    return ctx.say(line);
  }

  ask();
  if (waitForAnswer) document.addEventListener('answer-spoken', show, { once: true });
  return { node: box, show };
}
