// Crop box: shows a photo in a square. Drag it with a finger to move it, pinch or use the buttons to zoom.
// The square is the part that becomes pixel art.
import { el } from './el.js';

const SHOW = 600; // pixels drawn across the box (it's shown smaller, so it stays sharp)
const MOST_ZOOM = 5;

// source: a canvas holding the photo. onChange(): the crop moved. Returns { node, zoomBy(f), drawTo(canvas, px) }.
export function cropBox(source, onChange) {
  const canvas = el('canvas', { class: 'crop-canvas', width: SHOW, height: SHOW, 'aria-label': 'The photo, cropped to a square', role: 'img' });
  const node = el('div', { class: 'crop-box' }, canvas);
  const short = Math.min(source.width, source.height);
  let zoom = 1;
  let cx = source.width / 2;
  let cy = source.height / 2;

  const side = () => short / zoom;
  // Keeps the square inside the photo.
  const clamp = () => {
    const half = side() / 2;
    cx = Math.min(Math.max(cx, half), source.width - half);
    cy = Math.min(Math.max(cy, half), source.height - half);
  };
  const drawTo = (target, px) => {
    const c = target.getContext('2d');
    c.imageSmoothingEnabled = true;
    c.imageSmoothingQuality = 'high';
    c.clearRect(0, 0, px, px);
    c.drawImage(source, cx - side() / 2, cy - side() / 2, side(), side(), 0, 0, px, px);
  };
  const redraw = () => {
    clamp();
    drawTo(canvas, SHOW);
    onChange?.();
  };
  const zoomBy = (f) => {
    zoom = Math.min(MOST_ZOOM, Math.max(1, zoom * f));
    redraw();
  };

  // One finger drags; two fingers pinch.
  const fingers = new Map();
  let pinch = null;
  const spread = () => {
    const [a, b] = [...fingers.values()];
    return Math.hypot(a.x - b.x, a.y - b.y) || 1;
  };
  node.addEventListener('pointerdown', (e) => {
    node.setPointerCapture?.(e.pointerId);
    fingers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    pinch = fingers.size === 2 ? { spread: spread(), zoom } : null;
  });
  node.addEventListener('pointermove', (e) => {
    const was = fingers.get(e.pointerId);
    if (!was) return;
    const now = { x: e.clientX, y: e.clientY };
    fingers.set(e.pointerId, now);
    if (pinch && fingers.size === 2) {
      zoom = Math.min(MOST_ZOOM, Math.max(1, (pinch.zoom * spread()) / pinch.spread));
    } else if (fingers.size === 1) {
      const perPixel = side() / (node.clientWidth || SHOW);
      cx -= (now.x - was.x) * perPixel;
      cy -= (now.y - was.y) * perPixel;
    }
    redraw();
  });
  const lift = (e) => {
    fingers.delete(e.pointerId);
    pinch = null;
  };
  node.addEventListener('pointerup', lift);
  node.addEventListener('pointercancel', lift);

  redraw();
  return { node, zoomBy, drawTo };
}

// Opens a photo file as a canvas no bigger than `most` pixels across, so big phone photos stay quick to move.
export async function photoCanvas(file, most = 1024) {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const scale = Math.min(1, most / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}
