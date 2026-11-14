// How big to make it: 8, 12, 16, 24 or 32 blocks across. The starting size is the smallest one where the thing's
// parts are at least 2 blocks wide, so they don't vanish or turn into lone blocks. Two checks, and the bigger size
// wins: the thing's shape (legs, ears, a handle: rub out everything thinner than 2 blocks and see how much goes),
// and its colour parts (eyes, a mouth, a band: most of them must be 2 blocks wide where they're widest, wherever
// the grid lines fall, so 2.5 blocks in the photo).
import { squareAround } from './pixel-subject.js';

export const SIZES = [8, 12, 16, 24, 32];
const NO_SHAPE = 16; // with no background there's no shape to look at: start in the middle
const MOST_LOST = 0.1; // the shape is fine if under 10% of the thing is thinner than 2 blocks
const PART = 0.01; // a colour part must be at least 1% of the thing (smaller is a speck or texture)
const PART_BLOCKS = 2.5; // a part this many blocks wide in the photo is still 2 wide wherever the grid lines fall
const MOST_PARTS = 0.75; // and 3 in 4 colour parts must be that wide
const STEP = 3; // distances are counted 3 per pixel across, 4 per pixel corner to corner (close to real distance)
const DIAGONAL = 4;

// The 4 neighbours already visited in a forward pass, as [offset in the picture, x offset, distance].
const BEFORE = (width) => [[-1, -1, STEP], [-width, 0, STEP], [-width - 1, -1, DIAGONAL], [-width + 1, 1, DIAGONAL]];

// Two passes over the picture, forward then back. next(p, q, step) gives p's distance through neighbour q.
function passes(dist, width, next) {
  const n = dist.length;
  const around = BEFORE(width);
  for (let p = 0; p < n; p++) {
    const x = p % width;
    for (const [d, dx, step] of around) {
      const q = p + d;
      if (q >= 0 && x + dx >= 0 && x + dx < width) dist[p] = Math.min(dist[p], next(p, q, step));
    }
  }
  for (let p = n - 1; p >= 0; p--) {
    const x = p % width;
    for (const [d, dx, step] of around) {
      const q = p - d;
      if (q < n && x - dx >= 0 && x - dx < width) dist[p] = Math.min(dist[p], next(p, q, step));
    }
  }
  return dist;
}

// How far each pixel is from a pixel of another group (in steps): half the width of the part it's in, at its middle.
export function edgeDistance(labels, width) {
  const dist = new Float32Array(labels.length).fill(Infinity);
  return passes(dist, width, (p, q, step) => (labels[q] !== labels[p] ? step : dist[q] + step));
}

// The share of the thing (pixels with mask 0) in the square that's in parts thinner than reach * 2 pixels: what goes
// when every part a circle of that size can't fit in is rubbed out.
export function thinShare(mask, width, edges, reach, square) {
  const limit = reach * STEP;
  const fromWide = new Float32Array(mask.length).fill(Infinity);
  for (let p = 0; p < mask.length; p++) if (!mask[p] && edges[p] > limit) fromWide[p] = 0;
  passes(fromWide, width, (p, q, step) => (mask[q] === mask[p] ? fromWide[q] + step : Infinity));
  let thing = 0;
  let lost = 0;
  for (let y = square.y; y < square.y + square.side; y++) {
    for (let x = square.x; x < square.x + square.side; x++) {
      const p = y * width + x;
      if (mask[p]) continue;
      thing += 1;
      if (fromWide[p] > limit + 1) lost += 1;
    }
  }
  return lost / Math.max(1, thing);
}

// The smallest size where the shape's parts are 2 blocks wide.
export function shapeSize(mask, width, box) {
  if (!mask) return NO_SHAPE;
  const edges = edgeDistance(mask, width);
  for (const size of SIZES) {
    const square = squareAround(box, width, size);
    if (thinShare(mask, width, edges, square.side / size, square) <= MOST_LOST) return size;
  }
  return SIZES[SIZES.length - 1];
}

// The colour parts: patches of one colour group joined by their sides, not the background, not specks.
// Returns how wide each is at its widest, in pixels.
export function partWidths(labels, width, background) {
  const edges = edgeDistance(labels, width);
  const seen = new Uint8Array(labels.length);
  let thing = 0;
  for (const g of labels) if (g !== background) thing += 1;
  const widths = [];
  for (let start = 0; start < labels.length; start++) {
    if (seen[start] || labels[start] === background) continue;
    seen[start] = 1;
    const queue = [start];
    let widest = 0;
    for (let head = 0; head < queue.length; head++) {
      const p = queue[head];
      widest = Math.max(widest, edges[p]);
      const x = p % width;
      for (const q of [p - width, p + width, x > 0 ? p - 1 : -1, x < width - 1 ? p + 1 : -1]) {
        if (q >= 0 && q < labels.length && !seen[q] && labels[q] === labels[start]) {
          seen[q] = 1;
          queue.push(q);
        }
      }
    }
    if (queue.length >= thing * PART) widths.push((widest * 2) / STEP);
  }
  return widths;
}

// The smallest size where most colour parts are wide enough to stay 2 blocks wide.
export function partsSize(labels, width, box, background) {
  const widths = partWidths(labels, width, background);
  for (const size of SIZES) {
    const block = squareAround(box, width, size).side / size;
    if (widths.filter((w) => w >= block * PART_BLOCKS).length >= widths.length * MOST_PARTS) return size;
  }
  return SIZES[SIZES.length - 1];
}

// The starting size for the thing. mask: 1 for each background pixel (or null). box: around the thing (or null).
// labels: a colour group for each pixel; background: the background's group (or -1).
export function startingSize(mask, labels, width, box, background = -1) {
  return Math.max(shapeSize(mask, width, box), partsSize(labels, width, box, background));
}
