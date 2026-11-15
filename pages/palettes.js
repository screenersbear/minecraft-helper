// Block palettes (#/palettes): sets of 4 or 5 blocks that look good together (Cozy cabin, Ocean, Candy...), each
// shown as block pictures with names. Building with one palette makes a build look planned. Any build can be remixed
// with one from its cover.
import { el } from '../components/el.js';
import { topBar } from '../components/top-bar.js';
import { blockSwatches } from '../components/block-swatches.js';
import { PALETTES } from '../data/palettes.js';

export function palettesPage(ctx) {
  const card = (p) =>
    el(
      'section',
      { class: 'palette-card panel-box', id: `palette-${p.id}`, 'aria-label': p.name },
      el('h2', { class: 'palette-name' }, p.name),
      el('p', { class: 'palette-about' }, p.about),
      blockSwatches(ctx.book, p.blocks),
    );
  return {
    title: 'Block palettes',
    nodes: [
      ...topBar({ back: '#/make', right: 'Palettes' }, ctx),
      el(
        'div',
        { class: 'page make palettes' },
        el('h1', { class: 'page-title', tabindex: '-1' }, 'Block palettes'),
        el('p', { class: 'home-intro' }, 'Blocks that look good together. Pick one and build with only those. To try one on a build, open the build and tap Remix.'),
        PALETTES.map(card),
      ),
    ],
  };
}
