// Pixel art (#/pixel): take or pick a photo and turn it into blocks, start a ready-made picture, or keep going with
// pictures already started.
import { el } from '../components/el.js';
import { topBar } from '../components/top-bar.js';
import { makePixel } from '../components/make-pixel.js';

export function pixelHomePage(ctx) {
  return {
    title: 'Pixel art',
    nodes: [
      ...topBar({ left: { label: 'Make', href: '#/make' }, right: 'Pixel art' }),
      el(
        'div',
        { class: 'page make' },
        el('h1', { class: 'page-title', tabindex: '-1' }, 'Pixel art'),
        el('p', { class: 'home-intro' }, 'Turn a photo into blocks, or start a ready-made picture.'),
        makePixel(ctx),
      ),
    ],
  };
}
