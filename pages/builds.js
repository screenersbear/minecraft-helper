// Builds (#/builds): picture tiles of every build to copy layer by layer, with buttons to show only Easy, Medium or
// Big ones, and room ideas for inside a house under them.
import { el } from '../components/el.js';
import { topBar } from '../components/top-bar.js';
import { makeBuilds } from '../components/make-builds.js';

export function buildsPage(ctx) {
  let showing = 'All';
  const body = el('div', { class: 'make-body' });
  const draw = () =>
    body.replaceChildren(
      makeBuilds(ctx, showing, (which) => {
        showing = which;
        draw();
      }),
    );
  draw();
  return {
    title: 'Builds',
    nodes: [
      ...topBar({ left: { label: 'Make', href: '#/make' }, right: 'Builds' }),
      el(
        'div',
        { class: 'page make' },
        el('h1', { class: 'page-title', tabindex: '-1' }, 'Builds'),
        el('p', { class: 'home-intro' }, 'Copy one block by block. I read each layer and wait for you.'),
        body,
      ),
    ],
  };
}
