// Pixel art colours: measures colour the way people see it (CIELAB, and OKLab for picking blocks) and finds the
// block whose colour is closest. Colours are numbers like 0xRRGGBB. No dithering anywhere.

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

// 0xRRGGBB -> OKLab [L, a, b], times 100. OKLab keeps hues straight where CIELAB bends them: a strong blue stays
// blue (not purple) and red stays red (not halfway to orange).
export function toOklab(rgb) {
  const r = linear((rgb >> 16) & 255);
  const g = linear((rgb >> 8) & 255);
  const b = linear(rgb & 255);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    100 * (0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s),
    100 * (1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s),
    100 * (0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s),
  ];
}

const VIVID = 12; // OKLab colour strength above which a colour is too strong for terracotta (the dull version)
const HUE = 2.5; // how much more the hue counts than the colour strength

// How different a colour (OKLab) is from a block ({ id, ok }), the way people name colours: the hue counts most,
// then how strong the colour is, lightness least (block pictures are darker than photos). A strong colour doesn't
// get terracotta, the dull version of each colour: red is red concrete, not red terracotta. Squared.
export function blockGap(p, block) {
  const q = block.ok;
  const c1 = Math.hypot(p[1], p[2]);
  const dC = c1 - Math.hypot(q[1], q[2]);
  const dH2 = Math.max(0, (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2 - dC * dC);
  const dull = block.id.endsWith('_terracotta') && c1 > VIVID ? (c1 - VIVID) ** 2 : 0;
  return ((p[0] - q[0]) / 2) ** 2 + dC * dC + HUE * HUE * dH2 + dull;
}

// The blocks to choose from: every palette block, or only wool.
export function choices(palette, woolOnly = false) {
  return palette.filter((p) => !woolOnly || p.id.endsWith('_wool')).map((p) => ({ id: p.id, ok: toOklab(p.rgb) }));
}

// The closest block to a colour: its place in the choices list.
export function nearest(rgb, list) {
  const ok = toOklab(rgb);
  let best = 0;
  let bestDistance = Infinity;
  list.forEach((c, i) => {
    const d = blockGap(ok, c);
    if (d < bestDistance) {
      best = i;
      bestDistance = d;
    }
  });
  return best;
}

// Every pixel's colour as [L, a, b], 3 numbers per pixel. light: how much lightness counts (1 in full).
export function labPicture(rgb, light = 1) {
  const out = new Float32Array(rgb.length);
  const seen = new Map();
  for (let i = 0; i < rgb.length; i += 3) {
    const key = (rgb[i] << 16) | (rgb[i + 1] << 8) | rgb[i + 2];
    let lab = seen.get(key);
    if (!lab) {
      lab = labOf(rgb[i], rgb[i + 1], rgb[i + 2]);
      seen.set(key, lab);
    }
    out[i] = lab[0] * light;
    out[i + 1] = lab[1];
    out[i + 2] = lab[2];
  }
  return out;
}

// Lightness counted at half weight: a shadow and the lit side of the same thing are mostly lighter or darker, not a
// different colour, so this makes them close (used to find the background). Returns L / 2, a, b for each pixel.
export const HALF = 0.5;
export const halfLightLab = (rgb) => labPicture(rgb, HALF);

// How far apart pixels i and j are in a halfLightLab list (squared).
export function gap(lab, i, j) {
  const d0 = lab[i * 3] - lab[j * 3];
  const d1 = lab[i * 3 + 1] - lab[j * 3 + 1];
  const d2 = lab[i * 3 + 2] - lab[j * 3 + 2];
  return d0 * d0 + d1 * d1 + d2 * d2;
}
