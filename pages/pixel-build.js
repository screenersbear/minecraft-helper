// Pixel art, step 3 (#/pixel/<id>/<row>): build it row by row from the bottom, left to right. The voice reads each
// row ("Row 1: 3 white wool, 2 orange wool...") and waits for "next", "again" or "back", like a guide.
// How far you got is saved, so you can come back to it. The last row's big Done goes back to Pixel art.
import { el } from '../components/el.js';
import { topBar } from '../components/top-bar.js';
import { stepButtons } from '../components/step-buttons.js';
import { blockArt } from '../components/block-art.js';
import { itemPicture } from '../components/picture.js';
import { guideVoice } from '../speech/guide-voice.js';
import { getArt, updateArt } from '../data/pixel-store.js';
import { rowRuns, rowSentence, countText } from '../logic/pixel-rows.js';
import { parseCommand } from '../logic/commands.js';
import { toHash, parseHash } from '../logic/routes.js';

const HINT = 'Say "next", "again" or "back"';

export function pixelBuildPage(ctx, route) {
  const art = getArt(route.id);
  if (!art) return null;
  const { book } = ctx;
  const n = Math.min(route.step || 1, art.size);
  const say = rowSentence(book, art, n);
  const goRow = (to) => ctx.go(toHash({ page: 'pixel', id: art.id, step: to }), { replace: true });

  const bottom = el('div', { class: 'bottom' });
  const hint = el('p', { class: 'hint' });
  const done = () => {
    guideVoice.stop();
    updateArt(art.id, { row: art.size });
    ctx.go('#/pixel', { say: 'All done! It looks great.' });
  };
  const actions = {
    back: () => n > 1 && goRow(n - 1),
    again: () => ctx.say(say),
    next: () => {
      updateArt(art.id, { row: Math.max(art.row, n) });
      if (n < art.size) goRow(n + 1);
      else done();
    },
  };
  bottom.append(hint, stepButtons({ n, total: art.size, actions, done }));

  guideVoice.use(`pixel-${art.id}`, {
    onCommand: (text) => {
      const command = parseCommand(text);
      if (command) actions[command]();
    },
    onState: (on) => {
      hint.textContent = on ? HINT : '';
    },
  });
  hint.textContent = guideVoice.on ? HINT : '';

  const runs = rowRuns(art, n).map((r) => el('li', {}, itemPicture(book, r.id, 24), el('span', {}, countText(book, r))));
  const nodes = [
    ...topBar({ back: toHash({ page: 'pixel', id: art.id }), name: art.name, right: 'Build it' }, ctx),
    el(
      'div',
      { class: 'page guide pixel-build' },
      el('p', { class: 'small-label' }, art.name),
      el(
        'div',
        { class: 'step-head' },
        el('div', { class: 'step-number', 'aria-hidden': 'true' }, String(n)),
        el('div', {}, el('p', { class: 'small-label' }, `Row ${n} of ${art.size}, from the bottom`), el('h1', { class: 'step-title', tabindex: '-1' }, `Row ${n}`)),
      ),
      el('div', { class: 'art-view build-view' }, blockArt(book, art, { done: n - 1, current: n })),
      el('h2', { class: 'small-label run-label' }, 'Left to right'),
      el('ol', { class: 'row-runs' }, runs),
      bottom,
    ),
  ];
  const cleanup = () => {
    const next = parseHash(location.hash);
    if (next.page !== 'pixel' || next.id !== art.id || !next.step) guideVoice.stop();
  };
  return { nodes, say, title: `${art.name}, row ${n}`, cleanup };
}
