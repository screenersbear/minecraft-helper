// Guide answer: one step at a time, with a progress bar, a big step number, a picture and Back / Again / Next.
// Saying "next", "again" or "back" works too, while the guide is open.
import { el } from '../components/el.js';
import { topBar } from '../components/top-bar.js';
import { blockButton } from '../components/buttons.js';
import { feedbackArea } from '../components/feedback-area.js';
import { stepPicture } from '../components/step-picture.js';
import { guideVoice } from '../speech/guide-voice.js';
import { stepSentence } from '../logic/say.js';
import { toHash, parseHash, backHash } from '../logic/routes.js';
import { parseCommand } from '../logic/commands.js';

function progress(step, total) {
  const bars = Array.from({ length: total }, (_, i) => el('span', { class: i < step ? 'done' : '' }));
  return el('div', { class: 'progress', role: 'img', 'aria-label': `Step ${step} of ${total}` }, bars);
}

export function guidePage(ctx, route) {
  const guide = ctx.guides.find((g) => g.id === route.id);
  if (!guide) return null;
  const total = guide.steps.length;
  const n = Math.min(route.step || 1, total);
  const step = guide.steps[n - 1];
  const say = stepSentence(step, n);
  const goStep = (to) => ctx.go(toHash({ page: 'guide', id: guide.id, step: to, q: route.q, from: route.from }), { replace: true });

  const bottom = el('div', { class: 'bottom' });
  const hint = el('p', { class: 'hint' });
  const showDone = () => {
    guideVoice.stop();
    bottom.replaceChildren(feedbackArea(ctx, route.q, guide.title));
    ctx.say('Did that answer it?');
  };
  const actions = {
    back: () => n > 1 && goStep(n - 1),
    again: () => ctx.say(say),
    next: () => (n < total ? goStep(n + 1) : showDone()),
  };
  bottom.append(
    hint,
    el(
      'div',
      { class: 'three-up' },
      blockButton({ label: 'Back', tone: 'grey', onClick: actions.back, extra: n === 1 ? { disabled: true } : {} }),
      blockButton({ label: 'Again', tone: 'grey', onClick: actions.again }),
      blockButton({ label: n < total ? 'Next' : 'Done', tone: 'mango', onClick: actions.next }),
    ),
  );

  // Voice commands: keep one listener for the whole guide, so it isn't restarted at every step.
  guideVoice.use(guide.id, {
    onCommand: (text) => {
      const command = parseCommand(text);
      if (command) actions[command]();
    },
    onState: (on) => {
      hint.textContent = on ? 'Say "next", "again" or "back"' : '';
    },
  });
  hint.textContent = guideVoice.on ? 'Say "next", "again" or "back"' : '';

  const nodes = [
    ...topBar({ left: { label: 'Back', href: backHash(route) }, right: 'Guide' }),
    el(
      'div',
      { class: 'page guide' },
      el('p', { class: 'small-label' }, guide.title),
      progress(n, total),
      el(
        'div',
        { class: 'step-head' },
        el('div', { class: 'step-number', 'aria-hidden': 'true' }, String(n)),
        el('div', {}, el('p', { class: 'small-label' }, `Step ${n} of ${total}`), el('h1', { class: 'step-title', 'data-fit': '3', tabindex: '-1' }, step.title)),
      ),
      el('p', { class: 'say' }, step.say),
      stepPicture(ctx.book, step, guide.steps[n]),
      bottom,
    ),
  ];
  const cleanup = () => {
    const next = parseHash(location.hash);
    if (next.page !== 'guide' || next.id !== guide.id) guideVoice.stop();
  };
  return { nodes, say, title: guide.title, cleanup };
}
