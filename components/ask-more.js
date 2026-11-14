// Ask more: a small talk button at the bottom of every answer, so a kid can ask a follow-up ("how do I get it?")
// without going back. On a device that can't listen (an old iPad), it's a small box to type the follow-up in.
import { el } from './el.js';
import { talkButton } from './talk-button.js';
import { canListen } from '../speech/listen.js';

// The box to type a follow-up in, for devices that can't listen.
function typeMore(ask, about) {
  const input = el('input', { id: 'ask-more', type: 'text', placeholder: 'Type it here', autocomplete: 'off', autocapitalize: 'sentences', enterkeyhint: 'go', maxlength: '120' });
  const send = (e) => {
    e.preventDefault();
    const q = input.value.trim();
    input.blur();
    if (q) ask(q);
  };
  const label = el('label', { for: 'ask-more', class: 'small-label' }, `Ask ${about || 'more'}`);
  return { node: el('form', { class: 'type-it ask-more-typed', onsubmit: send }, label, input), stop: () => {} };
}

// talk: { onQuestion, onStart, onIdle, about }; the question goes to ctx.ask unless onQuestion says otherwise.
export function askMore(ctx, talk = {}) {
  if (!canListen()) return typeMore(talk.onQuestion || ((q) => ctx.ask(q)), talk.about);
  const { nodes, stop } = talkButton({
    small: true,
    onQuestion: talk.onQuestion || ((q) => ctx.ask(q)),
    onStart: talk.onStart,
    onIdle: talk.onIdle,
    about: talk.about,
  });
  const [button, label, heard] = nodes;
  const node = el('section', { class: 'ask-more', 'aria-label': 'Ask more' }, button, el('div', { class: 'ask-more-text' }, label, heard));
  return { node, stop };
}
