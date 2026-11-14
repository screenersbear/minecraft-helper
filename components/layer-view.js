// Layer view: one layer of a build seen from above, square by square. The back is at the top and the front (the
// door side) at the bottom. Where this layer is empty, the nearest block below shows faded, so you can see where
// you are. The low step of a stair is drawn darker than its tall back.
import { el } from './el.js';
import { loadBlockAtlas } from './build-picture.js';
import { sizeOf } from '../logic/builds.js';
import { topOf, belowAt } from '../logic/build-scene.js';

const GAP = 2;
const PAPER = '#FAFAF7';
const PANEL = '#C6C6C6';
const GLASS = '#D6E8EE';

// The size of each square, in CSS pixels, so the layer fits the screen: 48 at most.
export const cellSize = (W, room = 320) => Math.max(14, Math.min(48, Math.floor((room - (W - 1) * GAP) / W)));

// n: the layer, from 1 at the bottom. Returns { node, faded } (faded: whether any square shows the layer below).
export function layerView(build, looks, n, { room = 320 } = {}) {
  const { W, D } = sizeOf(build);
  const y = n - 1;
  const cell = cellSize(W, room);
  const dense = Math.min(3, window.devicePixelRatio || 1);
  const px = (v) => Math.round(v * dense);
  const width = W * cell + (W - 1) * GAP;
  const height = D * cell + (D - 1) * GAP;
  const canvas = el('canvas', {
    class: 'layer-view',
    width: px(width),
    height: px(height),
    role: 'img',
    'aria-label': `Layer ${n} seen from above. The front is at the bottom.`,
    style: { width: `${width}px`, height: `${height}px` },
  });
  let faded = false;
  const squares = [];
  for (let z = 0; z < D; z++) {
    for (let x = 0; x < W; x++) {
      let parts = topOf(build, looks, x, y, z);
      let alpha = 1;
      if (!parts.length) {
        const below = belowAt(build, x, y, z);
        if (below >= 0) {
          parts = topOf(build, looks, x, below, z);
          alpha = 0.3;
          faded = true;
        }
      }
      squares.push({ x, z, parts, alpha });
    }
  }
  const draw = (image) => {
    const g = canvas.getContext('2d');
    if (!g) return;
    g.imageSmoothingEnabled = false;
    g.fillStyle = PANEL;
    g.fillRect(0, 0, canvas.width, canvas.height);
    const cols = image ? Math.floor(image.width / 16) : 1;
    for (const sq of squares) {
      const left = sq.x * (cell + GAP);
      const top = sq.z * (cell + GAP);
      g.globalAlpha = 1;
      g.fillStyle = PAPER;
      g.fillRect(px(left), px(top), px(left + cell) - px(left), px(top + cell) - px(top));
      if (!image) continue;
      g.globalAlpha = sq.alpha;
      const high = Math.max(...sq.parts.map((p) => p.y));
      for (const p of sq.parts) {
        const dx = px(left + (p.x0 * cell) / 16);
        const dy = px(top + (p.z0 * cell) / 16);
        const dw = px(left + (p.x1 * cell) / 16) - dx;
        const dh = px(top + (p.z1 * cell) / 16) - dy;
        if (p.clear) {
          g.fillStyle = GLASS;
          g.fillRect(dx, dy, dw, dh);
        }
        g.drawImage(image, (p.tile % cols) * 16 + p.x0, Math.floor(p.tile / cols) * 16 + p.z0, p.x1 - p.x0, p.z1 - p.z0, dx, dy, dw, dh);
        // The low part of a block with two heights (a stair's step) is darker, so you can see which way it faces.
        if (!p.whole && p.y < high) {
          g.fillStyle = 'rgba(0, 0, 0, 0.4)';
          g.fillRect(dx, dy, dw, dh);
        }
      }
    }
    g.globalAlpha = 1;
  };
  draw(null);
  loadBlockAtlas().then(({ image }) => draw(image), () => {});
  return { node: canvas, faded };
}
