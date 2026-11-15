// My builds (#/mine): photos of things you built, saved on this phone, newest first. Add a photo opens the camera
// page; a photo opens big.
import { el } from '../components/el.js';
import { topBar } from '../components/top-bar.js';
import { blockButton } from '../components/buttons.js';
import { listMyBuilds } from '../data/my-builds.js';

export function minePage(ctx) {
  const builds = listMyBuilds();
  const tile = (b) => el('a', { class: 'mine-tile', href: `#/mine/${b.id}` }, el('img', { src: b.photo, alt: '' }), el('b', {}, b.name));
  return {
    title: 'My builds',
    nodes: [
      ...topBar({ back: '#/make', right: 'My builds' }, ctx),
      el(
        'div',
        { class: 'page make mine' },
        el('h1', { class: 'page-title', tabindex: '-1' }, 'My builds'),
        builds.length
          ? el('p', { class: 'home-intro' }, 'Photos of what you made. They stay on this phone.')
          : el('p', { class: 'home-intro' }, 'No photos yet. Build something, then take a photo of it in the game.'),
        blockButton({ label: 'Add a photo', tone: 'green', href: '#/mine/new' }),
        builds.length ? el('div', { class: 'mine-grid' }, builds.map(tile)) : null,
      ),
    ],
  };
}
