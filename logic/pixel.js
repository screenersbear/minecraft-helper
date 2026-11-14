// Pixel art colours: measures colour the way people see it (CIELAB) and finds the block whose colour is closest.
// Colours are numbers like 0xRRGGBB. No dithering anywhere.

// One sRGB channel (0 to 255) to linear light (0 to 1).
function linear(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

const pivot = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);

// 0xRRGGBB -> [L, a, b], with the D65 white point.
export function toLab(rgb) {
  return labOf((rgb >> 16) & 255, (rgb >> 8) & 255, rgb & 255);
}

// Red, green and blue (0 to 255) -> [L, a, b].
export function labOf(red, green, blue) {
  const r = linear(red);
  const g = linear(green);
  const b = linear(blue);
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

// Lightness counted at half weight: a shadow and the lit side of the same thing are mostly lighter or darker, not a
// different colour, so this makes them close. rgb: 3 numbers per pixel. Returns 3 numbers per pixel: L / 2, a, b.
export const HALF = 0.5;
export function halfLightLab(rgb) {
  const out = new Float32Array(rgb.length);
  const seen = new Map();
  for (let i = 0; i < rgb.length; i += 3) {
    const key = (rgb[i] << 16) | (rgb[i + 1] << 8) | rgb[i + 2];
    let lab = seen.get(key);
    if (!lab) {
      lab = labOf(rgb[i], rgb[i + 1], rgb[i + 2]);
      seen.set(key, lab);
    }
    out[i] = lab[0] * HALF;
    out[i + 1] = lab[1];
    out[i + 2] = lab[2];
  }
  return out;
}

// How far apart pixels i and j are in a halfLightLab list (squared).
export function gap(lab, i, j) {
  const d0 = lab[i * 3] - lab[j * 3];
  const d1 = lab[i * 3 + 1] - lab[j * 3 + 1];
  const d2 = lab[i * 3 + 2] - lab[j * 3 + 2];
  return d0 * d0 + d1 * d1 + d2 * d2;
}
