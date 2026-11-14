// A build, layer by layer (#/build/<id>/<layer>): the layer seen from above with the one below faded, what to put
// down, and how many of each block. The voice reads it out and waits for "next", "again" or "back", like a guide.
import { el } from '../components/el.js';
import { topBar } from '../components/top-bar.js';
import { blockButton } from '../components/buttons.js';
import { itemPicture } from '../components/picture.js';
import { layerView } from '../components/layer-view.js';
import { guideVoice } from '../speech/guide-voice.js';
import { findBuild, layerCounts, countWords, pictureId, layerSentence } from '../logic/builds.js';
import { parseCommand } from '../logic/commands.js';
import { toHash, parseHash } from '../logic/routes.js';

const HINT = 'Say "next", "again" or "back"';

// A small arrow pointing up at the front of the layer.
const upArrow = () => el('span', { class: 'front-arrow', 'aria-hidden': 'true' });

export function buildLayerPage(ctx, route) {
  const build = findBuild(ctx.builds.builds, route.id);
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
  const finish = () => {
    guideVoice.stop();
    const done = `All done! Your ${build.name.toLowerCase()} is finished.`;
    bottom.replaceChildren(
      el('p', { class: 'feedback-q', role: 'status' }, done),
      el('div', { class: 'two-up' }, blockButton({ label: 'Back to Make', tone: 'mango', href: '#/make' }), blockButton({ label: 'Look at it', tone: 'grey', href: cover })),
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
      blockButton({ label: n < total ? 'Next' : 'Done', tone: 'mango', onClick: actions.next }),
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

  const view = layerView(build, ctx.builds.blocks, n);
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
        el('figcaption', {}, el('span', { class: 'front-mark' }, upArrow(), 'Front (the door side)'), view.faded ? el('span', {}, 'Faded blocks are the layer below.') : null),
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
