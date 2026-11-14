// The Pixel art part of the Make page: take or pick a photo, start a ready-made picture (no photo needed), and
// come back to pictures already started.
import { el } from './el.js';
import { photoButtons } from './photo-button.js';
import { artThumb } from './art-thumb.js';
import { listArt, saveArt, newArtId } from '../data/pixel-store.js';
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

// A ready-made picture becomes the kid's own pixel art (the same one again if they already started it).
export function startReadyMade(starter, now = Date.now()) {
  const old = listArt().find((a) => a.starter === starter.id);
  if (old) return old.id;
  const id = newArtId(now);
  saveArt({ id, name: starter.name, size: starter.size, blocks: [...starter.blocks], cells: [...starter.cells], row: 0, made: now, starter: starter.id });
  return id;
}

function readyMade(ctx) {
  const starters = ctx.builds?.pixel || [];
  if (!starters.length) return null;
  return el(
    'section',
    { class: 'ready-made' },
    el('h2', { class: 'small-label' }, 'Ready-made pictures, no photo needed'),
    el(
      'div',
      { class: 'ready-grid' },
      starters.map((s) =>
        el('button', { class: 'ready-btn', type: 'button', onclick: () => ctx.go(toHash({ page: 'pixel', id: startReadyMade(s) })) }, artThumb(ctx.book, s, 64), el('span', {}, s.name)),
      ),
    ),
  );
}

export function makePixel(ctx) {
  const onPhoto = (file) => {
    setPhoto(file, 'pixel');
    ctx.go('#/pixel/crop');
  };
  return el(
    'div',
    { class: 'make-part' },
    el('p', { class: 'make-note' }, 'Turn a photo into a picture made of blocks.'),
    photoButtons(onPhoto),
    readyMade(ctx),
    myArt(ctx),
  );
}
