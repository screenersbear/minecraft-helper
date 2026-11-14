// Pixel art colours: swaps each square of a shrunk photo for the block whose colour is closest, the way people see
// colour (CIELAB), with no dithering. Colours are numbers like 0xRRGGBB.

// One sRGB channel (0 to 255) to linear light (0 to 1).
function linear(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

const pivot = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);

// 0xRRGGBB -> [L, a, b], with the D65 white point.
export function toLab(rgb) {
  const r = linear((rgb >> 16) & 255);
  const g = linear((rgb >> 8) & 255);
  const b = linear(rgb & 255);
  const x = pivot((r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047);
  const y = pivot(r * 0.2126 + g * 0.7152 + b * 0.0722);
  const z = pivot((r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

const distance = (p, q) => (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2;

// The blocks to choose from: every palette block, or only wool.
export function choices(palette, woolOnly = false) {
  return palette.filter((p) => !woolOnly || p.id.endsWith('_wool')).map((p) => ({ id: p.id, lab: toLab(p.rgb) }));
}

// The closest block to a colour: its place in the choices list.
export function nearest(rgb, list) {
  const lab = toLab(rgb);
  let best = 0;
  let bestDistance = Infinity;
  list.forEach((c, i) => {
    const d = distance(lab, c.lab);
    if (d < bestDistance) {
      best = i;
      bestDistance = d;
    }
  });
  return best;
}

// pixels: one 0xRRGGBB colour per square, top row first. Returns { blocks: block ids used, cells: a place in
// blocks for each square }. Colours already seen are remembered, so a photo with flat areas is quick.
export function matchPixels(pixels, palette, { woolOnly = false } = {}) {
  const list = choices(palette, woolOnly);
  const seen = new Map();
  const blocks = [];
  const cells = pixels.map((rgb) => {
    if (!seen.has(rgb)) {
      const id = list[nearest(rgb, list)].id;
      if (!blocks.includes(id)) blocks.push(id);
      seen.set(rgb, blocks.indexOf(id));
    }
    return seen.get(rgb);
  });
  return { blocks, cells };
}

// Shrinks a square picture's pixels (RGBA, width by width) to n by n squares, each the average of its part.
// Clear parts count as white paper. Returns 0xRRGGBB numbers, top row first.
export function averageSquares(data, width, n) {
  const out = [];
  const step = width / n;
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let count = 0;
      for (let y = Math.floor(row * step); y < Math.floor((row + 1) * step); y++) {
        for (let x = Math.floor(col * step); x < Math.floor((col + 1) * step); x++) {
          const i = (y * width + x) * 4;
          const a = data[i + 3] / 255;
          r += data[i] * a + 255 * (1 - a);
          g += data[i + 1] * a + 255 * (1 - a);
          b += data[i + 2] * a + 255 * (1 - a);
          count += 1;
        }
      }
      const avg = (v) => Math.round(v / Math.max(1, count));
      out.push((avg(r) << 16) | (avg(g) << 8) | avg(b));
    }
  }
  return out;
}
