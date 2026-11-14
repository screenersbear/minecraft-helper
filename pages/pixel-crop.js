// Pixel art, step 1 (#/pixel/crop): move and zoom the photo so the square holds what you want, see how it will
// look in blocks, give it a name, and make it. Everything happens on the phone; nothing is uploaded.
import { el } from '../components/el.js';
import { topBar } from '../components/top-bar.js';
import { blockButton } from '../components/buttons.js';
import { cropBox, photoCanvas } from '../components/crop-box.js';
import { artThumb } from '../components/art-thumb.js';
import { getPhoto, setPhoto } from '../data/photo.js';
import { chosenSize, saveArt, listArt, newArtId } from '../data/pixel-store.js';
import { averageSquares, matchPixels } from '../logic/pixel.js';
import { toHash } from '../logic/routes.js';

const DETAIL = 8; // each block is the average of 8 by 8 pixels of the photo

// The photo inside the square, shrunk to size by size colours.
function squareColours(crop, size) {
  const px = size * DETAIL;
  const canvas = el('canvas', { width: px, height: px });
  crop.drawTo(canvas, px);
  return averageSquares(canvas.getContext('2d').getImageData(0, 0, px, px).data, px, size);
}

// A small picture of the photo, kept with the pixel art for the Photo switch.
function photoSnapshot(crop) {
  const canvas = el('canvas', { width: 192, height: 192 });
  crop.drawTo(canvas, 192);
  return canvas.toDataURL('image/jpeg', 0.75);
}

function noPhoto() {
  return el(
    'div',
    { class: 'page' },
    el('h1', { class: 'home-title', tabindex: '-1' }, 'No photo'),
    el('p', { class: 'say' }, 'The photo was closed. Pick it again on the Make page.'),
    el('div', { class: 'bottom' }, blockButton({ label: 'Back to Make', tone: 'mango', href: '#/make' })),
  );
}

export function pixelCropPage(ctx) {
  const file = getPhoto('pixel');
  const size = chosenSize();
  const bar = topBar({ left: { label: 'Back', href: '#/make' }, right: 'Pixel art' });
  if (!file) return { nodes: [...bar, noPhoto()], title: 'Pixel art' };

  const stage = el('div', { class: 'crop-stage' }, el('p', { class: 'loading' }, 'Opening the photo...'));
  const preview = el('div', { class: 'crop-preview' });
  const name = el('input', { id: 'art-name', type: 'text', maxlength: '30', placeholder: 'Orange cat', autocomplete: 'off', enterkeyhint: 'done' });
  const make = blockButton({ label: 'Make it', tone: 'mango', extra: { disabled: true } });
  let crop = null;
  let pending = 0;

  // Shows how it will look in blocks, at most once a frame while the photo moves.
  const showPreview = () => {
    cancelAnimationFrame(pending);
    pending = requestAnimationFrame(() => {
      const { blocks, cells } = matchPixels(squareColours(crop, size), ctx.book.palette);
      preview.replaceChildren(artThumb(ctx.book, { size, blocks, cells }, 96), el('span', { class: 'small-label' }, `${size} by ${size} blocks`));
    });
  };

  make.addEventListener('click', () => {
    if (!crop) return;
    const rgb = squareColours(crop, size);
    const { blocks, cells } = matchPixels(rgb, ctx.book.palette);
    const art = {
      id: newArtId(),
      name: name.value.trim() || `Picture ${listArt().length + 1}`,
      size,
      blocks,
      cells,
      rgb,
      woolOnly: false,
      photo: photoSnapshot(crop),
      row: 0,
      made: Date.now(),
    };
    saveArt(art);
    setPhoto(null);
    ctx.go(toHash({ page: 'pixel', id: art.id }), { replace: true });
  });

  photoCanvas(file)
    .then((canvas) => {
      crop = cropBox(canvas, showPreview);
      const zoom = (label, f) => el('button', { class: 'zoom-btn notch', type: 'button', 'aria-label': label, onclick: () => crop.zoomBy(f) }, f > 1 ? '+' : '-');
      stage.replaceChildren(crop.node, el('div', { class: 'zoom-row' }, zoom('Zoom out', 1 / 1.25), zoom('Zoom in', 1.25)));
      make.disabled = false;
      showPreview();
    })
    .catch(() => stage.replaceChildren(el('p', { class: 'say' }, "Couldn't open that photo. Try another one.")));

  const nodes = [
    ...bar,
    el(
      'div',
      { class: 'page pixel-crop' },
      el('h1', { class: 'home-title', tabindex: '-1' }, 'Fit it in'),
      el('p', { class: 'home-intro' }, 'Drag the photo so the square holds what you want. Pinch to zoom.'),
      stage,
      el('div', { class: 'crop-bottom' }, preview, el('label', { class: 'name-it' }, el('span', { class: 'small-label' }, 'What is it?'), name)),
      el('div', { class: 'bottom' }, make),
    ),
  ];
  return { nodes, title: 'Pixel art', cleanup: () => cancelAnimationFrame(pending) };
}
