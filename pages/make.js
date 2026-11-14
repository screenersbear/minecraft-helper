// Make: one of the five home pages, in two parts. Builds: picture tiles of things to build block by block, with
// buttons to show only Easy, Medium or Big ones. Pixel art: turn a photo (or a ready-made picture) into blocks.
// The page remembers which part was open. A small link at the bottom saves an idea for a new build.
import { el } from '../components/el.js';
import { makeBuilds } from '../components/make-builds.js';
import { makePixel } from '../components/make-pixel.js';
import { load, save } from '../data/store.js';

const PART = 'mc-helper.make-part';
const PARTS = ['Builds', 'Pixel art'];

export function makePanel(ctx) {
  let part = PARTS.includes(load(PART, 'Builds')) ? load(PART, 'Builds') : 'Builds';
  let showing = 'All';
  const body = el('div', { class: 'make-body' });
  const switchRow = el('div', { class: 'switch-row make-switch', role: 'group', 'aria-label': 'Builds or pixel art' });

  const draw = () => {
    switchRow.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.textContent === part)));
    body.replaceChildren(
      part === 'Builds'
        ? makeBuilds(ctx, showing, (which) => {
          showing = which;
          draw();
        })
        : makePixel(ctx),
    );
  };
  const choose = (which) => {
    part = which;
    save(PART, which);
    draw();
  };
  switchRow.append(...PARTS.map((which) => el('button', { class: 'switch-btn', type: 'button', 'aria-pressed': 'false', onclick: () => choose(which) }, which)));
  draw();

  const node = el(
    'div',
    { class: 'page home-page make' },
    el('h1', { class: 'home-title', tabindex: '-1' }, 'Make'),
    el('p', { class: 'home-intro' }, 'Build something block by block, or turn a photo into blocks.'),
    switchRow,
    body,
    el('a', { class: 'idea-link', href: '#/idea' }, 'Want to build something else? Save it as an idea'),
  );
  return { node };
}
