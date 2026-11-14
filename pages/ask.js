// Ask: the first screen. Hold the mango button and ask, or type it. "Asked before" shows the last few questions.
// A long press on the title opens the grown-ups screen. The Shelf button in the top bar holds About.
import { el } from '../components/el.js';
import { topBar } from '../components/top-bar.js';
import { talkButton } from '../components/talk-button.js';
import { shelfMenu } from '../components/shelf.js';
import { itemPicture, mobPicture } from '../components/picture.js';
import { listRecent } from '../data/recent.js';
import { tidyQuestion } from '../logic/say.js';

const LONG_PRESS = 800;

// Holding the title for a while opens the grown-ups screen. Lifting or moving the finger cancels it.
function onLongPress(node, action) {
  let timer = null;
  const cancel = () => clearTimeout(timer);
  node.addEventListener('pointerdown', () => {
    cancel();
    timer = setTimeout(action, LONG_PRESS);
  });
  ['pointerup', 'pointerleave', 'pointercancel', 'pointermove'].forEach((type) =>
    node.addEventListener(type, (e) => {
      if (type !== 'pointermove' || Math.abs(e.movementX) + Math.abs(e.movementY) > 6) cancel();
    }),
  );
  node.addEventListener('contextmenu', (e) => e.preventDefault());
}

function recentPicture(book, pic) {
  if (!pic) return el('span', { class: 'pic-ask', 'aria-hidden': 'true' }, '?');
  return pic.kind === 'mob' ? mobPicture(book, pic.id, 32) : itemPicture(book, pic.id, 32);
}

function askedBefore(ctx) {
  const recent = listRecent(3);
  if (!recent.length) return null;
  return el(
    'section',
    { class: 'asked-before' },
    el('h2', { class: 'small-label' }, 'Asked before'),
    recent.map((r) => el('button', { class: 'recent-row', type: 'button', onclick: () => ctx.ask(r.q) }, recentPicture(ctx.book, r.pic), el('span', {}, tidyQuestion(r.q)))),
  );
}

export function askPage(ctx) {
  const input = el('input', {
    id: 'q',
    type: 'text',
    placeholder: 'How do I make a bed?',
    autocomplete: 'off',
    autocapitalize: 'sentences',
    enterkeyhint: 'go',
    maxlength: '120',
  });
  const form = el(
    'form',
    {
      class: 'type-it',
      onsubmit: (e) => {
        e.preventDefault();
        input.blur();
        ctx.ask(input.value);
      },
    },
    el('label', { for: 'q', class: 'small-label' }, 'Or type it'),
    input,
  );
  const talk = talkButton({ onQuestion: (q) => ctx.ask(q), onNoMic: () => input.focus() });
  const title = el('h1', { class: 'ask-title', tabindex: '-1' }, 'Ask the', el('br'), 'guide');
  onLongPress(title, () => ctx.go('#/grown-ups'));

  const shelf = shelfMenu(ctx.book, [{ label: 'About this guide', href: '#/about', pic: 'book' }]);
  const [bar, strip] = topBar({ left: 'Bedrock guide', right: shelf.button });
  bar.append(shelf.panel);

  const nodes = [
    bar,
    strip,
    el(
      'div',
      { class: 'page ask' },
      el('div', { class: 'ask-intro' }, el('p', {}, 'Ask me anything about the game.'), title),
      el('div', { class: 'talk-area' }, talk.nodes),
      form,
      askedBefore(ctx),
    ),
  ];
  const cleanup = () => {
    talk.stop();
    shelf.cleanup();
  };
  return { nodes, title: 'Ask', cleanup };
}
