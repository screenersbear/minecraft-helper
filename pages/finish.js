// Finish it (#/finish): half-built starters, like a house with no roof or a garden with no paths. You build the
// start layer by layer, then it's your turn to finish it your own way.
import { el } from '../components/el.js';
import { topBar } from '../components/top-bar.js';
import { buildTile } from '../components/make-builds.js';

export function finishPage(ctx) {
  const { builds, blocks } = ctx.builds || { builds: [], blocks: {} };
  const starters = builds.filter((b) => b.group === 'Finish it');
  return {
    title: 'Finish it',
    nodes: [
      ...topBar({ back: '#/make', right: 'Finish it' }, ctx),
      el(
        'div',
        { class: 'page make' },
        el('h1', { class: 'page-title', tabindex: '-1' }, 'Finish it'),
        el('p', { class: 'home-intro' }, "Build the start, layer by layer. Then it's your turn: finish it your own way."),
        el('div', { class: 'build-grid' }, starters.map((b) => buildTile(b, blocks))),
      ),
    ],
  };
}
