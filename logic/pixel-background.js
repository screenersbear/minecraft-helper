// Finding the background: the colour most of the photo's edge shares, filled in from the edges through every pixel
// close to it (like a paint bucket), so the wall or table behind the thing becomes one flat block.
import { gap } from './pixel.js';

const SAME_EDGE = 12 ** 2; // edge pixels this close count as the same colour (squared, in half-lightness Lab)
const NEAR_BACKGROUND = 18 ** 2; // how far from the background colour the fill may go
const SMALL_STEP = 7 ** 2; // and each step of the fill must be this small, so it stops at edges
const MOST_EDGE = 0.35; // the background must cover at least this much of the edge
const MOST_PICTURE = 0.92; // a "background" covering more than this is really the thing itself

// Every pixel on the picture's edge, once each.
export function edgePixels(width) {
  const out = [];
  for (let x = 0; x < width; x++) out.push(x, (width - 1) * width + x);
  for (let y = 1; y < width - 1; y++) out.push(y * width, y * width + width - 1);
  return width === 1 ? [0] : out;
}

// lab: halfLightLab of the picture, width by width. Returns { mask, colour } where mask has 1 for each background
// pixel and colour is the pixel the fill compared with, or null when there's no clear background.
export function findBackground(lab, width) {
  const edge = edgePixels(width);
  // The edge colour shared by the most other edge pixels.
  let seed = -1;
  let most = 0;
  for (const p of edge) {
    let near = 0;
    for (const q of edge) if (gap(lab, p, q) < SAME_EDGE) near++;
    if (near > most) {
      most = near;
      seed = p;
    }
  }
  if (most < edge.length * MOST_EDGE) return null;

  const mask = new Uint8Array(width * width);
  const queue = [];
  for (const p of edge) {
    if (!mask[p] && gap(lab, p, seed) < NEAR_BACKGROUND) {
      mask[p] = 1;
      queue.push(p);
    }
  }
  for (let head = 0; head < queue.length; head++) {
    const p = queue[head];
    const x = p % width;
    for (const q of [p - width, p + width, x > 0 ? p - 1 : -1, x < width - 1 ? p + 1 : -1]) {
      if (q < 0 || q >= mask.length || mask[q]) continue;
      if (gap(lab, q, seed) < NEAR_BACKGROUND && gap(lab, q, p) < SMALL_STEP) {
        mask[q] = 1;
        queue.push(q);
      }
    }
  }
  if (queue.length > mask.length * MOST_PICTURE) return null;
  return { mask, colour: seed };
}
