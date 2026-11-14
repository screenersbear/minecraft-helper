// The grown-ups list of questions, in groups by reason: Wrong, Hard to understand, Not what I asked, Not in the
// book, Missing answers. Each entry shows the question as heard, what the app answered, when and how many times,
// and an X to take it off the list when it's done (with an Undo for a few seconds).
import { el } from './el.js';
import { icon } from './icons.js';
import { groupQuestions, answerText, timesText, removeQuestion, restoreQuestion } from '../data/questions-log.js';
import { whenLabel } from '../logic/routes.js';
import { tidyQuestion } from '../logic/say.js';

const UNDO_FOR = 5000;
const newestFirst = (a, b) => b.last - a.last;

// list: the entries, newest first. Returns { node, entries() }: entries() is what's still on the list.
export function questionLog(list) {
  const box = el('div', { class: 'log-groups' });
  let entries = [...list];

  function draw() {
    if (!entries.length) {
      box.replaceChildren(el('p', { class: 'say' }, "Nothing to look at yet. Questions the book can't answer show up here."));
      return;
    }
    box.replaceChildren(
      ...groupQuestions(entries).map((g) =>
        el('section', { class: 'log-group' }, el('h2', { class: 'log-group-title' }, `${g.label} (${g.entries.length})`), el('ul', { class: 'log' }, g.entries.map(row))),
      ),
    );
  }

  function row(e) {
    const q = tidyQuestion(e.q);
    const li = el(
      'li',
      {},
      el('div', { class: 'log-text' }, el('p', { class: 'log-q' }, q), el('p', { class: 'log-answer' }, answerText(e)), el('p', { class: 'log-when' }, `${whenLabel(e.last)} · ${timesText(e.times)}`)),
      el('button', { class: 'log-x', type: 'button', 'aria-label': `Done. Remove "${q}"`, onclick: () => remove(e, li) }, icon('close', 28)),
    );
    return li;
  }

  function remove(e, li) {
    const gone = removeQuestion(e.key);
    entries = entries.filter((x) => x.key !== e.key);
    const putBack = () => {
      restoreQuestion(gone);
      entries = [...entries, gone].sort(newestFirst);
      draw();
    };
    const undoRow = el('li', { class: 'log-removed' }, el('span', {}, 'Removed.'), el('button', { class: 'undo-btn', type: 'button', onclick: putBack }, 'Undo'));
    li.replaceWith(undoRow);
    undoRow.querySelector('button').focus();
    setTimeout(() => {
      if (!undoRow.isConnected) return;
      undoRow.remove();
      if (!box.querySelector('.log-removed')) draw();
    }, UNDO_FOR);
  }

  draw();
  return { node: box, entries: () => entries };
}
