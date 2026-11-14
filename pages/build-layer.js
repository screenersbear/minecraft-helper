// A build, layer by layer (#/build/<id>/<layer>): the layer seen from above with the one below faded, what to put
// down, and how many of each block. The voice reads it out and waits for "next", "again" or "back", like a guide.
// A half-built starter (Finish it) ends with "Your turn!" and ideas for finishing it, instead of "All done".
import { el } from '../components/el.js';
import { topBar } from '../components/top-bar.js';
import { blockButton } from '../components/buttons.js';
import { itemPicture } from '../components/picture.js';
import { layerView } from '../components/layer-view.js';
import { guideVoice } from '../speech/guide-voice.js';
import { layerCounts, countWords, pictureId, layerSentence } from '../logic/builds.js';
import { remixedBuild } from '../data/remixes.js';
import { wideScreen } from '../components/wide-screen.js';
import { parseCommand } from '../logic/commands.js';
import { toHash, parseHash } from '../logic/routes.js';

const HINT = 'Say "next", "again" or "back"';

// A small arrow pointing up at the front of the layer.
const upArrow = () => el('span', { class: 'front-arrow', 'aria-hidden': 'true' });

export function buildLayerPage(ctx, route) {
  const build = remixedBuild(ctx, route.id);
  if (!build) return null;
  const { book } = ctx;
  const total = build.layers.length;
  const n = Math.min(route.step || 1, total);
  const layer = build.layers[n - 1];
  const say = layerSentence(book, build, n);
  const cover = toHash({ page: 'build', id: build.id, from: route.from });
  const goLayer = (to) => ctx.go(toHash({ page: 'build', id: build.id, step: to, from: route.from }), { replace: true });

  const bottom = el('div', { class: 'bottom' });
  const hint = el('p', { class: 'hint' });
  const yourTurn = () => {
    const { say: words, ideas } = build.yourTurn;
    bottom.replaceChildren(
      el('p', { class: 'feedback-q', role: 'status' }, 'Your turn!'),
      el('p', { class: 'say' }, words),
      el('ul', { class: 'turn-ideas' }, ideas.map((idea) => el('li', {}, idea))),
      el('div', { class: 'two-up' }, blockButton({ label: 'Save a photo', tone: 'green', href: '#/mine/new' }), blockButton({ label: 'More to finish', tone: 'grey', href: '#/finish' })),
    );
    bottom.scrollIntoView({ block: 'end' });
    ctx.say(`Your turn! ${words} Here are some ideas. ${ideas.join(' ')}`);
  };
  const finish = () => {
    guideVoice.stop();
    if (build.yourTurn) return yourTurn();
    const done = `All done! Your ${build.name.toLowerCase()} is finished.`;
    bottom.replaceChildren(
      el('p', { class: 'feedback-q', role: 'status' }, done),
      el('div', { class: 'two-up' }, blockButton({ label: build.group === 'Finish it' ? 'More to finish' : 'More builds', tone: 'green', href: build.group === 'Finish it' ? '#/finish' : '#/builds' }), blockButton({ label: 'Look at it', tone: 'grey', href: cover })),
    );
    ctx.say(done);
  };
  const actions = {
    back: () => (n > 1 ? goLayer(n - 1) : ctx.go(cover, { replace: true })),
    again: () => ctx.say(say),
    next: () => (n < total ? goLayer(n + 1) : finish()),
  };
  bottom.append(
    hint,
    el(
      'div',
      { class: 'three-up' },
      blockButton({ label: 'Back', tone: 'grey', onClick: actions.back }),
      blockButton({ label: 'Again', tone: 'grey', onClick: actions.again }),
      blockButton({ label: n < total ? 'Next' : build.yourTurn ? 'Your turn' : 'Done', tone: 'green', onClick: actions.next }),
    ),
  );
  guideVoice.use(`build-${build.id}`, {
    onCommand: (text) => {
      const command = parseCommand(text);
      if (command) actions[command]();
    },
    onState: (on) => {
      hint.textContent = on ? HINT : '';
    },
  });
  hint.textContent = guideVoice.on ? HINT : '';

  const view = layerView(build, ctx.builds.blocks, n, { room: wideScreen() ? 440 : 320 });
  const runs = layerCounts(build, n).map((c) => el('li', {}, itemPicture(book, pictureId(c.id), 24), el('span', {}, countWords(book, c))));
  const nodes = [
    ...topBar({ left: { label: 'Back', href: cover }, right: build.name }),
    el(
      'div',
      { class: 'page guide build-layer' },
      el(
        'div',
        { class: 'step-head' },
        el('div', { class: 'step-number', 'aria-hidden': 'true' }, String(n)),
        el('div', {}, el('p', { class: 'small-label' }, `Layer ${n} of ${total}, from the bottom`), el('h1', { class: 'step-title', tabindex: '-1' }, layer.name)),
      ),
      layer.tip ? el('p', { class: 'say' }, layer.tip) : null,
      el(
        'figure',
        { class: 'layer-figure' },
        el('div', { class: 'layer-frame' }, view.node),
        el('figcaption', {}, el('span', { class: 'front-mark' }, upArrow(), el('span', {}, 'Front (the door side)')), view.faded ? el('span', {}, 'Faded blocks are the layer below.') : null),
      ),
      el('h2', { class: 'small-label run-label' }, 'This layer'),
      el('ul', { class: 'row-runs' }, runs),
      bottom,
    ),
  ];
  const cleanup = () => {
    const next = parseHash(location.hash);
    if (next.page !== 'build' || next.id !== build.id) guideVoice.stop();
  };
  return { nodes, say, title: `${build.name}, layer ${n}`, cleanup };
}
