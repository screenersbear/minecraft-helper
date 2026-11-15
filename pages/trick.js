// A builder trick (#/trick/roof-stairs/2), one step at a time like a guide: a progress bar, the step's number and
// title, what to do, a 3D picture with the new blocks outlined in yellow (and the blocks from before darker), the new
// blocks by name, and a tip. "‹ Step", "Again" and "Step ›", or say "back", "again" or "next". The last step's big
// Done goes back to the tricks. Each step fits one screen (components/step-screen.js): the picture is as big as
// the room left over, and the tip shows when there's room for it (or behind More).
import { el } from '../components/el.js';
import { topBar } from '../components/top-bar.js';
import { stepButtons } from '../components/step-buttons.js';
import { progress } from '../components/progress.js';
import { buildPicture } from '../components/build-picture.js';
import { blockSwatches } from '../components/block-swatches.js';
import { guideVoice } from '../speech/guide-voice.js';
import { stepSentence } from '../logic/say.js';
import { toHash, parseHash } from '../logic/routes.js';
import { parseCommand } from '../logic/commands.js';
import { stepBuild, newBlocks } from '../logic/tricks.js';
import { stepScreen } from '../components/step-screen.js';

const HINT = 'Say "next", "again" or "back"';

export function trickPage(ctx, route) {
  const trick = (ctx.tricks || []).find((t) => t.id === route.id);
  if (!trick) return null;
  const total = trick.steps.length;
  const n = Math.min(route.step || 1, total);
  const step = trick.steps[n - 1];
  const say = step.tip ? `${stepSentence(step, n)} Tip: ${step.tip}` : stepSentence(step, n);
  const goStep = (to) => ctx.go(toHash({ page: 'trick', id: trick.id, step: to }), { replace: true });
  const done = () => ctx.go('#/tricks');
  const actions = {
    back: () => n > 1 && goStep(n - 1),
    again: () => ctx.say(say),
    next: () => (n < total ? goStep(n + 1) : done()),
  };

  // Voice commands: one listener for the whole trick, like a guide.
  const hint = el('p', { class: 'hint' });
  guideVoice.use(`trick:${trick.id}`, {
    onCommand: (text) => {
      const command = parseCommand(text);
      if (command) actions[command]();
    },
    onState: (on) => {
      hint.textContent = on ? HINT : '';
    },
  });
  hint.textContent = guideVoice.on ? HINT : '';

  const added = newBlocks(trick, n - 1).filter((id) => ctx.book.items[id]?.pic >= 0);
  // The 3D picture, as big as fits in its grey frame (10 pixels of padding and a 2 pixel edge all round).
  const frame = el('div', { class: 'trick-frame' });
  const fit = (w, h) => frame.replaceChildren(buildPicture(stepBuild(trick, n - 1), ctx.builds.blocks, { w: w - 24, h: h - 24, label: `Step ${n}: ${step.title}` }));
  const words = () => el('p', { class: 'say' }, step.say);
  const label = () => (added.length ? el('h2', { class: 'small-label' }, 'New blocks, outlined in yellow') : null);
  const swatches = () => (added.length ? blockSwatches(ctx.book, added) : null);
  const tip = () => (step.tip ? el('div', { class: 'trick-tip' }, el('b', {}, 'Tip'), el('p', {}, step.tip)) : null);
  const screen = stepScreen({
    className: 'guide trick',
    head: [
      el('p', { class: 'small-label' }, trick.name),
      progress(n, total),
      el(
        'div',
        { class: 'step-head' },
        el('div', { class: 'step-number', 'aria-hidden': 'true' }, String(n)),
        el('div', {}, el('p', { class: 'small-label' }, `Step ${n} of ${total}`), el('h1', { class: 'step-title', 'data-fit': '3', tabindex: '-1' }, step.title)),
      ),
    ],
    art: { node: frame, fit },
    words: [{ node: words(), min: 2 }, added.length && { node: label(), min: 99 }, added.length && { node: swatches(), min: 1 }].filter(Boolean),
    extras: [tip()].filter(Boolean),
    more: () => [words(), label(), swatches(), tip()],
    bottom: el('div', { class: 'bottom' }, hint, stepButtons({ n, total, actions, done })),
  });
  const nodes = [...topBar({ back: '#/tricks', right: 'Builder trick' }, ctx), screen.node];
  const cleanup = () => {
    screen.stop();
    const next = parseHash(location.hash);
    if (next.page !== 'trick' || next.id !== trick.id) guideVoice.stop();
  };
  return { nodes, say, title: trick.name, cleanup };
}
