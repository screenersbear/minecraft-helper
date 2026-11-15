// A build's cover (#/build/<id>): the finished build in 3D, how big it is, and every block it needs, most first.
// Start building goes to layer 1. Saying "next" starts it too. Remix opens buttons to build it in another wood or a
// block palette, or flipped; the picture, the block list and the layers all follow.
import { el } from '../components/el.js';
import { topBar } from '../components/top-bar.js';
import { blockButton, speakerButton } from '../components/buttons.js';
import { itemPicture } from '../components/picture.js';
import { buildPicture } from '../components/build-picture.js';
import { guideVoice } from '../speech/guide-voice.js';
import { remixPanel } from '../components/remix-panel.js';
import { wideScreen } from '../components/wide-screen.js';
import { findBuild, buildCounts, countWords, pictureId, coverSentence, sizeText } from '../logic/builds.js';
import { remixOf, setRemix, remixedBuild } from '../data/remixes.js';
import { parseCommand } from '../logic/commands.js';
import { toHash, parseHash, backHash } from '../logic/routes.js';

const HINT = 'Say "next" to start';
// The build whose Remix buttons are open, so they stay open while you try remixes.
let remixing = null;

// Where Back goes: the page it was opened from, or Ask after a question, or the Builds page.
// Where Back goes from a build: where it was opened from, or its list (Builds, or Finish it for a starter).
const LISTS = { 'Finish it': '#/finish' };
export const buildBack = (route, build) => (route.from || route.trail.length || route.q ? backHash(route) : LISTS[build?.group] || '#/builds');

// The coloured tag: Easy, Medium or Big (and Creative, for builds that need Creative blocks).
export function buildTags(build) {
  return el(
    'span',
    { class: 'build-tags' },
    el('span', { class: `tag tag-${build.difficulty.toLowerCase()}` }, build.difficulty),
    build.creative ? el('span', { class: 'tag tag-creative' }, 'Creative') : null,
  );
}

export function buildCoverPage(ctx, route) {
  const original = findBuild(ctx.builds.builds, route.id);
  if (!original) return null;
  const build = remixedBuild(ctx, route.id);
  const changeRemix = (remix) => {
    setRemix(build.id, remix);
    ctx.refresh();
  };
  const panel = remixing === build.id ? remixPanel(build, original, ctx.builds.blocks, remixOf(build.id), changeRemix) : null;
  const toggleRemix = () => {
    remixing = remixing === build.id ? null : build.id;
    ctx.refresh();
  };
  const { book } = ctx;
  const say = coverSentence(book, build);
  const start = toHash({ page: 'build', id: build.id, step: 1, from: route.from });
  const hint = el('p', { class: 'hint' });
  const actions = {
    back: () => ctx.go(buildBack(route, build)),
    again: () => ctx.say(say),
    next: () => ctx.go(start),
  };
  guideVoice.use(`build-${build.id}`, {
    onCommand: (text) => {
      const command = parseCommand(text);
      if (command) actions[command]();
    },
    onState: (on) => {
      hint.textContent = on ? HINT : 'I read each layer and wait for you.';
    },
  });
  hint.textContent = guideVoice.on ? HINT : 'I read each layer and wait for you.';

  const needs = buildCounts(build).map((c) => {
    const [count, ...name] = countWords(book, c).split(' ');
    return el('li', { class: 'need' }, itemPicture(book, pictureId(c.id), 28), el('span', {}, el('b', {}, count), ` ${name.join(' ')}`));
  });
  const nodes = [
    ...topBar({ back: buildBack(route, build), right: build.group === 'Builds' ? 'Builds' : build.group }, ctx),
    el(
      'div',
      { class: 'page build-cover' },
      el('div', { class: 'build-hero' }, buildPicture(build, ctx.builds.blocks, wideScreen() ? { w: 480, h: 320 } : { w: 300, h: 200 })),
      el('div', { class: 'title-row' }, el('h1', { class: 'answer-title', 'data-fit': '2', tabindex: '-1' }, build.name), speakerButton(actions.again)),
      el('p', { class: 'build-meta' }, buildTags(build), el('span', {}, sizeText(build))),
      build.variant ? el('p', { class: 'remix-tag' }, `Remixed: ${build.variant}`) : null,
      el('p', { class: 'say' }, build.about),
      panel,
      el('h2', { class: 'small-label' }, 'Blocks you need, most first'),
      el('ul', { class: 'need-grid' }, needs),
      el(
        'div',
        { class: 'bottom' },
        hint,
        el(
          'div',
          { class: 'two-up' },
          blockButton({ label: panel ? 'Close remix' : 'Remix', tone: 'grey', onClick: toggleRemix, extra: { 'aria-expanded': String(!!panel) } }),
          blockButton({ label: 'Start building', tone: 'green', href: start }),
        ),
      ),
    ),
  ];
  const cleanup = () => {
    const next = parseHash(location.hash);
    if (next.page !== 'build' || next.id !== build.id) guideVoice.stop();
  };
  return { nodes, say, title: build.name, cleanup };
}
