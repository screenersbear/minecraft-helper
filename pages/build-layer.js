// A build, layer by layer (#/build/<id>/<layer>): the layer seen from above with the one below faded, what to put
// down, and how many of each block. The voice reads it out and waits for "next", "again" or "back", like a guide.
// The last layer's big Done goes back to where the build was opened from, saying "All done!". A half-built starter
// (Finish it) ends with "Your turn!" and ideas for finishing it first. Each layer fits one screen
// (components/step-screen.js): the picture is drawn as big as the room left over.
import { el } from '../components/el.js';
import { topBar } from '../components/top-bar.js';
import { blockButton } from '../components/buttons.js';
import { stepButtons } from '../components/step-buttons.js';
import { buildBack } from './build-cover.js';
import { itemPicture } from '../components/picture.js';
import { layerView } from '../components/layer-view.js';
import { guideVoice } from '../speech/guide-voice.js';
import { layerCounts, countWords, pictureId, layerSentence } from '../logic/builds.js';
import { remixedBuild } from '../data/remixes.js';
import { stepScreen } from '../components/step-screen.js';
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
  // Done: back to where the build was opened from (the list of builds, the book...), saying it's finished.
  const done = () => {
    guideVoice.stop();
    ctx.go(buildBack(route, build), { say: `All done! Your ${build.name.toLowerCase()} is finished.` });
  };
  const doneButton = blockButton({ label: 'Done', tone: 'green', onClick: done, extra: { class: 'block-btn tone-green done-btn' } });
  const yourTurn = () => {
    guideVoice.stop();
    const { say: words, ideas } = build.yourTurn;
    screen.body.classList.add('is-turn');
    screen.body.replaceChildren(
      el('p', { class: 'feedback-q', role: 'status' }, 'Your turn!'),
      el('p', { class: 'say' }, words),
      el('ul', { class: 'turn-ideas' }, ideas.map((idea) => el('li', {}, idea))),
    );
    bottom.replaceChildren(blockButton({ label: 'Save a photo of it', tone: 'grey', href: '#/mine/new' }), doneButton);
    ctx.say(`Your turn! ${words} Here are some ideas. ${ideas.join(' ')}`);
  };
  const last = build.yourTurn ? yourTurn : done;
  const actions = {
    back: () => n > 1 && goLayer(n - 1),
    again: () => ctx.say(say),
    next: () => (n < total ? goLayer(n + 1) : last()),
  };
  bottom.append(hint, stepButtons({ n, total, actions, done: last, doneLabel: build.yourTurn ? 'Your turn' : 'Done' }));
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

  // The layer, as big as fits: the frame and the words under it take their room first.
  const view = layerView(build, ctx.builds.blocks, n);
  const frame = el('div', { class: 'layer-frame' }, view.node);
  const caption = el('figcaption', {}, el('span', { class: 'front-mark' }, upArrow(), el('span', {}, 'Front (the door side)')), view.faded ? el('span', {}, 'Faded blocks are the layer below.') : null);
  const fit = (w, h) => frame.replaceChildren(layerView(build, ctx.builds.blocks, n, { room: w - 24, tall: h - caption.offsetHeight - 30 }).node);
  const runs = () => el('ul', { class: 'row-runs' }, layerCounts(build, n).map((c) => el('li', {}, itemPicture(book, pictureId(c.id), 24), el('span', {}, countWords(book, c)))));
  const tip = () => (layer.tip ? el('p', { class: 'say' }, layer.tip) : null);
  const label = () => el('h2', { class: 'small-label run-label' }, 'This layer');
  const screen = stepScreen({
    className: 'guide build-layer',
    head: el(
      'div',
      { class: 'step-head' },
      el('div', { class: 'step-number', 'aria-hidden': 'true' }, String(n)),
      el('div', {}, el('p', { class: 'small-label' }, `Layer ${n} of ${total}, from the bottom`), el('h1', { class: 'step-title', tabindex: '-1' }, layer.name)),
    ),
    art: { node: el('figure', { class: 'layer-figure' }, frame, caption), fit },
    words: [tip() && { node: tip(), min: 2 }, { node: label(), min: 99 }, { node: runs(), min: 1 }].filter(Boolean),
    more: () => [tip(), label(), runs()],
    bottom,
  });
  const nodes = [...topBar({ back: cover, right: 'Build it' }, ctx), screen.node];
  const cleanup = () => {
    screen.stop();
    const next = parseHash(location.hash);
    if (next.page !== 'build' || next.id !== build.id) guideVoice.stop();
  };
  return { nodes, say, title: `${build.name}, layer ${n}`, cleanup };
}
