// Smoothing, the first step of turning a photo into blocks: it takes away speckles and texture (fur, grain, the
// bumps on a basketball) but keeps edges sharp, so each thing becomes a flat patch of colour.
// Pictures here are square, width by width, 3 numbers (red, green, blue) per pixel, top row first.

// RGBA (as a canvas gives it) to RGB. See-through parts count as white paper.
export function toRgb(data) {
  const n = data.length / 4;
  const out = new Uint8ClampedArray(n * 3);
  for (let i = 0; i < n; i++) {
    const a = data[i * 4 + 3] / 255;
    for (let c = 0; c < 3; c++) out[i * 3 + c] = data[i * 4 + c] * a + 255 * (1 - a);
  }
  return out;
}

// The middle of 9 numbers, by swapping pairs into order in a fixed pattern (quicker than sorting them).
const PAIRS = [[1, 2], [4, 5], [7, 8], [0, 1], [3, 4], [6, 7], [1, 2], [4, 5], [7, 8], [0, 3], [5, 8], [4, 7], [3, 6], [1, 4], [2, 5], [4, 7], [4, 2], [6, 4], [4, 2]];
export function middleOf9(v) {
  for (const [a, b] of PAIRS) {
    if (v[a] > v[b]) {
      const t = v[a];
      v[a] = v[b];
      v[b] = t;
    }
  }
  return v[4];
}

// The middle value of each 3 by 3 patch, one colour at a time. Gets rid of single odd pixels.
export function median3(rgb, width) {
  const out = new Uint8ClampedArray(rgb.length);
  const values = new Int16Array(9);
  for (let y = 0; y < width; y++) {
    for (let x = 0; x < width; x++) {
      for (let c = 0; c < 3; c++) {
        let n = 0;
        for (let dy = -1; dy <= 1; dy++) {
          const sy = Math.min(width - 1, Math.max(0, y + dy));
          for (let dx = -1; dx <= 1; dx++) {
            const sx = Math.min(width - 1, Math.max(0, x + dx));
            values[n++] = rgb[(sy * width + sx) * 3 + c];
          }
        }
        out[(y * width + x) * 3 + c] = middleOf9(values);
      }
    }
  }
  return out;
}

// Running totals of each colour and its square, so the average of any rectangle takes 4 lookups.
function totals(rgb, width) {
  const w = width + 1;
  const sum = new Float64Array(w * w * 3);
  const squares = new Float64Array(w * w * 3);
  for (let y = 0; y < width; y++) {
    for (let x = 0; x < width; x++) {
      for (let c = 0; c < 3; c++) {
        const v = rgb[(y * width + x) * 3 + c];
        const at = ((y + 1) * w + x + 1) * 3 + c;
        const up = (y * w + x + 1) * 3 + c;
        const left = ((y + 1) * w + x) * 3 + c;
        const corner = (y * w + x) * 3 + c;
        sum[at] = v + sum[up] + sum[left] - sum[corner];
        squares[at] = v * v + squares[up] + squares[left] - squares[corner];
      }
    }
  }
  return { sum, squares, w };
}

// Kuwahara filter: each pixel looks at the 4 squares that have it as a corner and takes the average of the
// calmest one (the least change in colour). Flat areas get flatter, and an edge never gets blurred across.
export function kuwahara(rgb, width, radius = 2) {
  const { sum, squares, w } = totals(rgb, width);
  const out = new Uint8ClampedArray(rgb.length);
  const box = (x0, y0, x1, y1, table, c) =>
    table[(y1 * w + x1) * 3 + c] - table[(y0 * w + x1) * 3 + c] - table[(y1 * w + x0) * 3 + c] + table[(y0 * w + x0) * 3 + c];
  for (let y = 0; y < width; y++) {
    for (let x = 0; x < width; x++) {
      let best = Infinity;
      for (const [dx, dy] of [[-radius, -radius], [0, -radius], [-radius, 0], [0, 0]]) {
        const x0 = Math.max(0, x + dx);
        const y0 = Math.max(0, y + dy);
        const x1 = Math.min(width, x + dx + radius + 1);
        const y1 = Math.min(width, y + dy + radius + 1);
        const n = (x1 - x0) * (y1 - y0);
        let change = 0;
        const mean = [0, 0, 0];
        for (let c = 0; c < 3; c++) {
          mean[c] = box(x0, y0, x1, y1, sum, c) / n;
          change += box(x0, y0, x1, y1, squares, c) / n - mean[c] * mean[c];
        }
        if (change < best) {
          best = change;
          for (let c = 0; c < 3; c++) out[(y * width + x) * 3 + c] = mean[c];
        }
      }
    }
  }
  return out;
}

// The whole smoothing step: speckles out first, then the texture, twice.
export function smooth(rgb, width) {
  return kuwahara(kuwahara(median3(rgb, width), width, 2), width, 2);
}
