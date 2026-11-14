// Guide answer: one step at a time, with a progress bar, a big step number, a picture and Back / Again / Next.
// Saying "next", "again" or "back" works too, while the guide is open. Things the step mentions are links, with Ask
// next buttons under it. The small talk button asks something else (the guide stops listening while it's held),
// and "Did that answer it?" comes after the last step.
import { el } from '../components/el.js';
import { topBar } from '../components/top-bar.js';
import { blockButton } from '../components/buttons.js';
import { feedbackArea } from '../components/feedback-area.js';
import { askMore } from '../components/ask-more.js';
import { answerLabel } from '../logic/target-name.js';
import { stepPicture } from '../components/step-picture.js';
import { linkedText } from '../components/linked-text.js';
import { followChips } from '../components/follow-chips.js';
import { parseTarget } from '../logic/where.js';
import { guideVoice } from '../speech/guide-voice.js';
import { stepSentence } from '../logic/say.js';
import { toHash, parseHash, backHash } from '../logic/routes.js';
import { parseCommand } from '../logic/commands.js';
import { progress } from '../components/progress.js';

export function guidePage(ctx, route) {
  const guide = ctx.guides.find((g) => g.id === route.id);
  if (!guide) return null;
  const total = guide.steps.length;
  const n = Math.min(route.step || 1, total);
  const step = guide.steps[n - 1];
  const say = stepSentence(step, n);
  // What the guide is about ("mob:cat"), so "what do they eat?" after it is about cats.
  const chips = followChips(ctx, { topic: parseTarget(guide.topic), text: step.say, here: location.hash, guide: guide.id });
  const goStep = (to) => ctx.go(toHash({ page: 'guide', id: guide.id, step: to, q: route.q, from: route.from }), { replace: true });

  const bottom = el('div', { class: 'bottom' });
  const hint = el('p', { class: 'hint' });
  const showDone = () => {
    guideVoice.stop();
    const asked = feedbackArea(ctx, { question: route.q, answer: answerLabel('guide', guide.title), target: { type: 'guide', id: guide.id }, say, waitForAnswer: false });
    bottom.replaceChildren(asked.node, more.node);
    ctx.say('Did that answer it?', asked.show);
  };
  const actions = {
    back: () => n > 1 && goStep(n - 1),
    again: () => ctx.say(say),
    next: () => {
      if (n < total) return goStep(n + 1);
      finished = true;
      showDone();
    },
  };
  bottom.append(
    hint,
    el(
      'div',
      { class: 'three-up' },
      blockButton({ label: 'Back', tone: 'grey', onClick: actions.back, extra: n === 1 ? { disabled: true } : {} }),
      blockButton({ label: 'Again', tone: 'grey', onClick: actions.again }),
      blockButton({ label: n < total ? 'Next' : 'Done', tone: 'green', onClick: actions.next }),
    ),
  );

  // Voice commands: keep one listener for the whole guide, so it isn't restarted at every step.
  let finished = false;
  const listen = () =>
    !finished &&
    guideVoice.use(guide.id, {
      onCommand: (text) => {
        const command = parseCommand(text);
        if (command) actions[command]();
      },
      onState: (on) => {
        hint.textContent = on ? 'Say "next", "again" or "back"' : '';
      },
    });
  listen();
  hint.textContent = guideVoice.on ? 'Say "next", "again" or "back"' : '';
  // Asking more: "next" said into it still turns the page.
  const more = askMore(ctx, {
    onStart: () => guideVoice.stop(),
    onIdle: listen,
    onQuestion: (text) => {
      const command = parseCommand(text);
      if (!command) return ctx.ask(text);
      listen();
      actions[command]();
    },
  });
  bottom.append(more.node);

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
      linkedText(ctx, step.say),
      stepPicture(ctx.book, step, guide.steps[n]),
      chips.node,
      bottom,
    ),
  ];
  const cleanup = () => {
    more.stop();
    const next = parseHash(location.hash);
    if (next.page !== 'guide' || next.id !== guide.id) guideVoice.stop();
  };
  return { nodes, say, title: guide.title, cleanup, memory: chips.memory };
}
