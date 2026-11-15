// A builder trick (#/trick/roof-stairs/2), one step at a time like a guide: a progress bar, the step's number and
// title, what to do, a 3D picture with the new blocks outlined in yellow (and the blocks from before darker), the new
// blocks by name, and a tip. "‹ Step", "Again" and "Step ›", or say "back", "again" or "next". The last step's big
// Done goes back to the tricks.
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
import { wideScreen } from '../components/wide-screen.js';

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
  const picture = buildPicture(stepBuild(trick, n - 1), ctx.builds.blocks, { ...(wideScreen() ? { w: 480, h: 340 } : { w: 320, h: 230 }), label: `Step ${n}: ${step.title}` });
  const nodes = [
    ...topBar({ back: '#/tricks', right: 'Builder trick' }, ctx),
    el(
      'div',
      { class: 'page guide trick' },
      el('p', { class: 'small-label' }, trick.name),
      progress(n, total),
      el(
        'div',
        { class: 'step-head' },
        el('div', { class: 'step-number', 'aria-hidden': 'true' }, String(n)),
        el('div', {}, el('p', { class: 'small-label' }, `Step ${n} of ${total}`), el('h1', { class: 'step-title', 'data-fit': '3', tabindex: '-1' }, step.title)),
      ),
      el('p', { class: 'say' }, step.say),
      el('div', { class: 'trick-frame' }, picture),
      added.length ? [el('h2', { class: 'small-label' }, 'New blocks, outlined in yellow'), blockSwatches(ctx.book, added)] : null,
      step.tip ? el('div', { class: 'trick-tip' }, el('b', {}, 'Tip'), el('p', {}, step.tip)) : null,
      el(
        'div',
        { class: 'bottom' },
        hint,
        stepButtons({ n, total, actions, done }),
      ),
    ),
  ];
  const cleanup = () => {
    const next = parseHash(location.hash);
    if (next.page !== 'trick' || next.id !== trick.id) guideVoice.stop();
  };
  return { nodes, say, title: trick.name, cleanup };
}
