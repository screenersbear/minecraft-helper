// Answer head: the top of every answer. "You asked: ...", the big name with a speaker button, and the sentence.
import { el } from './el.js';
import { speakerButton } from './buttons.js';
import { askedLine } from '../logic/say.js';

export function answerHead({ question, title, sentence, onSay }) {
  return el(
    'div',
    { class: 'answer-head' },
    question ? el('p', { class: 'small-label' }, askedLine(question)) : null,
    el('div', { class: 'title-row' }, el('h1', { class: 'answer-title', 'data-fit': '2', tabindex: '-1' }, title), speakerButton(onSay)),
    el('p', { class: 'say' }, sentence),
  );
}
