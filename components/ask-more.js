// Ask more: a small talk button at the bottom of every answer, so a kid can ask a follow-up ("how do I get it?")
// without going back. With no microphone, tapping it opens Ask to type instead.
import { el } from './el.js';
import { talkButton } from './talk-button.js';

// talk: { onQuestion, onStart, onIdle, about }; the question goes to ctx.ask unless onQuestion says otherwise.
export function askMore(ctx, talk = {}) {
  const { nodes, stop } = talkButton({
    small: true,
    onQuestion: talk.onQuestion || ((q) => ctx.ask(q)),
    onNoMic: () => ctx.go('#/'),
    onStart: talk.onStart,
    onIdle: talk.onIdle,
    about: talk.about,
  });
  const [button, label, heard] = nodes;
  const node = el('section', { class: 'ask-more', 'aria-label': 'Ask more' }, button, el('div', { class: 'ask-more-text' }, label, heard));
  return { node, stop };
}
