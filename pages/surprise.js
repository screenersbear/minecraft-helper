// Surprise me (#/surprise): a random build challenge ("Build a house for a fox using only 3 kinds of blocks"), read
// out loud, with a hint, a block palette to try and an optional timer. Another one gives a new challenge; none comes
// back until every one has been seen. Let's build! starts the timer (if there is one). When time's up, it says so.
import { el } from '../components/el.js';
import { topBar } from '../components/top-bar.js';
import { blockButton } from '../components/buttons.js';
import { blockSwatches } from '../components/block-swatches.js';
import { paletteById } from '../data/palettes.js';
import { load, save } from '../data/store.js';
import { nextChallenge, clockText } from '../logic/challenges.js';

const SEEN = 'mc-helper.challenges-seen';
const NOW = 'mc-helper.challenge-now';
const TIMER = 'mc-helper.challenge-timer';
const TIMES = [0, 10, 20, 30];
const TIME_UP = "Time's up! Show someone what you built.";

const sayOf = (c) => `${c.text} ${c.hint}`;

// The challenge on screen now, or a new one if there isn't one yet.
function current(list) {
  const id = load(NOW, '');
  const found = list.find((c) => c.id === id);
  return found || pickNew(list);
}

function pickNew(list) {
  const { challenge, seen } = nextChallenge(list, load(SEEN, []));
  save(SEEN, seen);
  if (challenge) save(NOW, challenge.id);
  return challenge;
}

function card(book, c) {
  const palette = paletteById(c.palette);
  return el(
    'div',
    { class: 'challenge-card panel-box' },
    el('p', { class: 'challenge-text' }, c.text),
    el('p', { class: 'challenge-hint' }, c.hint),
    palette ? el('p', { class: 'challenge-palette' }, 'Try these blocks: ', el('a', { href: '#/palettes' }, palette.name)) : null,
    palette ? blockSwatches(book, palette.blocks) : null,
  );
}

export function surprisePage(ctx) {
  const list = ctx.challenges || [];
  let challenge = current(list);
  if (!challenge) return null;
  let minutes = TIMES.includes(load(TIMER, 0)) ? load(TIMER, 0) : 0;
  let ticking = null;
  const area = el('div', { class: 'surprise-area' });
  const stop = () => clearInterval(ticking);

  // Picking: the challenge, the timer buttons, Another one and Let's build!
  const showPick = () => {
    stop();
    const timerBtns = TIMES.map((m) =>
      el('button', { class: 'block-btn small-btn', type: 'button', 'aria-pressed': String(m === minutes), onclick: () => setTimer(m) }, m ? `${m} min` : 'None'),
    );
    const setTimer = (m) => {
      minutes = m;
      save(TIMER, m);
      timerBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(TIMES[i] === m)));
    };
    area.replaceChildren(
      card(ctx.book, challenge),
      el('h2', { class: 'small-label timer-label' }, 'Add a timer?'),
      el('div', { class: 'four-up', role: 'group', 'aria-label': 'Timer' }, timerBtns),
      el(
        'div',
        { class: 'bottom' },
        el('div', { class: 'two-up' }, blockButton({ label: 'Another one', tone: 'grey', onClick: another }), blockButton({ label: "Let's build!", tone: 'green', onClick: build })),
      ),
    );
  };

  // Done (or time's up): well done, save a photo of it, or try another.
  const showDone = (text) => {
    stop();
    area.replaceChildren(
      el('p', { class: 'challenge-done shadow-text', role: 'status' }, text),
      el('p', { class: 'say' }, challenge.text),
      el(
        'div',
        { class: 'bottom' },
        blockButton({ label: 'Save a photo of it', tone: 'green', href: '#/mine/new' }),
        blockButton({ label: 'Another one', tone: 'grey', onClick: another }),
      ),
    );
    ctx.say(text);
  };

  // Building: the clock counting down, or a cheer if there's no timer.
  const build = () => {
    const end = Date.now() + minutes * 60000;
    const clock = el('p', { class: 'challenge-clock', 'aria-live': 'off' }, minutes ? clockText(minutes * 60) : 'Go!');
    area.replaceChildren(
      el('p', { class: 'say' }, challenge.text),
      clock,
      el('p', { class: 'small-label clock-note' }, minutes ? 'left on the clock' : 'Take your time. Tap Done when it\'s built.'),
      el(
        'div',
        { class: 'bottom' },
        el('div', { class: 'two-up' }, blockButton({ label: 'Stop', tone: 'grey', onClick: showPick }), blockButton({ label: 'Done!', tone: 'green', onClick: () => showDone('Nice building!') })),
      ),
    );
    ctx.say(minutes ? `You have ${minutes} minutes. Go!` : 'Go build it!');
    if (!minutes) return;
    ticking = setInterval(() => {
      const left = (end - Date.now()) / 1000;
      clock.textContent = clockText(left);
      if (left <= 0) showDone(TIME_UP);
    }, 500);
  };

  function another() {
    challenge = pickNew(list);
    showPick();
    ctx.say(sayOf(challenge));
  }

  showPick();
  return {
    title: 'Surprise me',
    say: sayOf(challenge),
    nodes: [
      ...topBar({ back: '#/make', right: 'Surprise me' }, ctx),
      el('div', { class: 'page surprise' }, el('h1', { class: 'challenge-label', tabindex: '-1' }, 'Your challenge'), area),
    ],
    cleanup: stop,
  };
}
