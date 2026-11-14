// Pixel art, step 1 (#/pixel/crop): move and zoom the photo so the square holds what you want, see how it will
// look in blocks, pick how big (it starts at the size that fits the thing best), give it a name, and make it.
// Everything happens on the phone; nothing is uploaded.
import { el } from '../components/el.js';
import { topBar } from '../components/top-bar.js';
import { blockButton } from '../components/buttons.js';
import { cropBox, photoCanvas } from '../components/crop-box.js';
import { artThumb } from '../components/art-thumb.js';
import { sizePicker, sizeNote } from '../components/size-picker.js';
import { getPhoto, setPhoto } from '../data/photo.js';
import { saveArt, listArt, newArtId } from '../data/pixel-store.js';
import { photoPixels } from '../data/art-photo.js';
import { prepareClose, blocksFrom, suggestSize, WORK, WHOLE } from '../logic/pixel-convert.js';
import { toHash } from '../logic/routes.js';

const WAIT = 120; // ms after the photo stops moving before the preview is made again
const KEEP = 320; // the saved photo is this many pixels across

// A part of the photo inside the square ({ x, y, side } as fractions) as pixels, px across, for the converter.
function squarePixels(crop, px, part) {
  const canvas = el('canvas', { width: px, height: px });
  crop.drawTo(canvas, px, part);
  return canvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, px, px).data;
}

// A picture of the photo, kept with the pixel art for the Photo switch and to make the blocks again. It's the
// close-up of the thing (part), so the thing keeps its detail.
function photoSnapshot(crop, part) {
  const canvas = el('canvas', { width: KEEP, height: KEEP });
  crop.drawTo(canvas, KEEP, part);
  return canvas.toDataURL('image/jpeg', 0.85);
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
  const bar = topBar({ left: { label: 'Back', href: '#/make' }, right: 'Pixel art' });
  if (!file) return { nodes: [...bar, noPhoto()], title: 'Pixel art' };

  const stage = el('div', { class: 'crop-stage' }, el('p', { class: 'loading' }, 'Opening the photo...'));
  const preview = el('div', { class: 'crop-preview' });
  const name = el('input', { id: 'art-name', type: 'text', maxlength: '30', placeholder: 'Name it', autocomplete: 'off', enterkeyhint: 'done' });
  const make = blockButton({ label: 'Make it', tone: 'mango', extra: { disabled: true } });
  let crop = null;
  let pending = 0;
  let prep = null; // the photo, ready to make any size (see prepare in pixel-convert.js)
  let size = 16;
  let round = false;
  let picked = false; // true once the kid taps a size: then it stays, wherever the photo moves

  const drawPreview = () => {
    if (!prep) return;
    const { blocks, cells } = blocksFrom(prep, size, ctx.book.palette);
    preview.replaceChildren(artThumb(ctx.book, { size, blocks, cells }, 96), el('span', { class: 'small-label' }, `${size} by ${size} blocks`));
    sizes.show(size, sizeNote(size, round, picked));
  };
  const sizes = sizePicker((n) => {
    size = n;
    picked = true;
    drawPreview();
  });

  // Shows how it will look in blocks, once the photo stops moving for a moment (so dragging stays smooth). Until
  // the kid picks a size, the size follows the thing: the smallest where its parts are 2 blocks wide.
  let asked = 0;
  const showPreview = () => {
    clearTimeout(pending);
    pending = setTimeout(async () => {
      const mine = ++asked;
      const ready = await prepareClose((part) => squarePixels(crop, WORK, part));
      if (mine !== asked) return;
      prep = ready;
      const suggested = suggestSize(prep);
      round = suggested.round;
      if (!picked) size = suggested.size;
      drawPreview();
    }, WAIT);
  };

  // Made from the saved photo, the same one the result page uses when the settings change.
  make.addEventListener('click', async () => {
    if (!crop || make.disabled) return;
    make.disabled = true;
    const photo = photoSnapshot(crop, prep?.part || WHOLE);
    const made = blocksFrom(await prepareClose((part) => photoPixels(photo, WORK, part)), size, ctx.book.palette);
    const art = {
      id: newArtId(),
      name: name.value.trim() || `Picture ${listArt().length + 1}`,
      size,
      blocks: made.blocks,
      cells: made.cells,
      background: made.background,
      colours: null,
      autoColours: made.autoColours,
      mostColours: made.mostColours,
      outline: false,
      woolOnly: false,
      edits: {},
      swaps: {},
      photo,
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
      sizes.node,
      el('div', { class: 'bottom' }, make),
    ),
  ];
  const cleanup = () => {
    clearTimeout(pending);
    asked += 1;
  };
  return { nodes, title: 'Pixel art', cleanup };
}
