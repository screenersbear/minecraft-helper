// Make: one of the five home pages. Turn a photo into pixel art: take or pick a photo (how big is picked on the
// next page, to fit the thing), and come back to pictures already started. A small link at the bottom saves a photo as an idea for a 3D build.
import { el } from '../components/el.js';
import { photoButtons } from '../components/photo-button.js';
import { artThumb } from '../components/art-thumb.js';
import { listArt } from '../data/pixel-store.js';
import { setPhoto } from '../data/photo.js';
import { toHash } from '../logic/routes.js';

function progressText(art) {
  const rows = art.size;
  if (art.row >= rows) return `${art.size} by ${art.size} · all done`;
  if (art.row > 0) return `${art.size} by ${art.size} · up to row ${art.row}`;
  return `${art.size} by ${art.size} · not started`;
}

function myArt(ctx) {
  const list = listArt();
  if (!list.length) return null;
  return el(
    'section',
    { class: 'my-art' },
    el('h2', { class: 'small-label' }, 'My pixel art'),
    list.map((art) =>
      el(
        'a',
        { class: 'art-row', href: toHash({ page: 'pixel', id: art.id, step: art.row > 0 && art.row < art.size ? art.row + 1 : undefined }) },
        artThumb(ctx.book, art, 48),
        el('span', { class: 'art-text' }, el('b', {}, art.name), el('small', {}, progressText(art))),
        el('span', { class: 'art-go' }, art.row >= art.size ? 'Look' : 'Keep going'),
      ),
    ),
  );
}

export function makePanel(ctx) {
  const onPhoto = (file) => {
    setPhoto(file, 'pixel');
    ctx.go('#/pixel/crop');
  };
  const node = el(
    'div',
    { class: 'page home-page make' },
    el('h1', { class: 'home-title', tabindex: '-1' }, 'Pixel art'),
    el('p', { class: 'home-intro' }, 'Turn a photo into a picture made of blocks.'),
    photoButtons(onPhoto),
    myArt(ctx),
    el('a', { class: 'idea-link', href: '#/idea' }, 'Want a real 3D build? Save it as an idea'),
  );
  return { node };
}
