// Fixing the light, before any colours are picked. A warm lamp makes a white table look orange and turns lime into
// yellow, so this takes the lamp's colour out (white balance): it finds something that should be white or grey
// (the background, or else the brightest part of the photo, or else the whole photo, gently) and makes it grey
// again, changing everything else the same way. Then it lifts the colours a little.
// Pictures are 3 numbers (red, green, blue) per pixel.
import { labOf } from './pixel.js';

const PLAIN = 38; // something white under a warm lamp (yellow to orange) has less colour than this (Lab chroma)
const FAINT = 12; // any other tint must be fainter than this: a pale blue sky isn't a white wall
const BRIGHTEST = 0.05; // the brightest 5% of the photo
const MOST_CHANGE = 1.6; // no colour is made more than this much stronger or weaker
const WHOLE_PHOTO = 0.5; // the whole photo as grey is only a guess, so it's used at half strength
const LIFT = 1.15; // how much stronger the colours get afterwards

const LINEAR = Float32Array.from({ length: 256 }, (_, c) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
});
const toByte = (v) => {
  const s = v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055;
  return Math.round(255 * Math.min(1, Math.max(0, s)));
};
const luma = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

// The average light of some pixels, as linear red, green, blue (0 to 1).
export function lightOf(rgb, pixels) {
  const sum = [0, 0, 0];
  for (const p of pixels) for (let c = 0; c < 3; c++) sum[c] += LINEAR[rgb[p * 3 + c]];
  return sum.map((v) => v / Math.max(1, pixels.length));
}

// Whether a light could be white or grey seen under a lamp: not too dark, and either a warm tint (lamps are yellow
// to orange) that isn't too strong, or only a faint tint of any other colour.
export function couldBeGrey(light) {
  const [L, a, b] = labOf(...light.map(toByte));
  const tint = Math.hypot(a, b);
  const warm = b > 0 && a > -FAINT;
  return L > 35 && (tint < FAINT || (warm && tint < PLAIN));
}

// Where the lamp's colour shows: { light, strength }, or null if nothing in the photo can tell.
// mask: 1 for each background pixel (or null).
export function lampLight(rgb, mask) {
  const n = rgb.length / 3;
  const all = Array.from({ length: n }, (_, p) => p);
  if (mask) {
    const light = lightOf(rgb, all.filter((p) => mask[p]));
    if (couldBeGrey(light)) return { light, strength: 1 };
  }
  const bright = [...all].sort((p, q) => luma(rgb[q * 3], rgb[q * 3 + 1], rgb[q * 3 + 2]) - luma(rgb[p * 3], rgb[p * 3 + 1], rgb[p * 3 + 2]));
  const top = lightOf(rgb, bright.slice(0, Math.max(1, Math.round(n * BRIGHTEST))));
  if (couldBeGrey(top) && Math.max(...top) < 0.98) return { light: top, strength: 1 };
  const whole = lightOf(rgb, all);
  return couldBeGrey(whole) ? { light: whole, strength: WHOLE_PHOTO } : null;
}

// How much to multiply each colour by, so the lamp's light becomes grey.
export function gainsFor(lamp) {
  if (!lamp) return [1, 1, 1];
  const middle = (lamp.light[0] + lamp.light[1] + lamp.light[2]) / 3;
  return lamp.light.map((c) => {
    const full = Math.min(MOST_CHANGE, Math.max(1 / MOST_CHANGE, middle / Math.max(c, 1e-4)));
    return 1 + (full - 1) * lamp.strength;
  });
}

// The photo with the lamp's colour taken out and the colours lifted a little. Returns a new picture.
export function fixLight(rgb, mask = null) {
  const gains = gainsFor(lampLight(rgb, mask));
  const out = new Uint8ClampedArray(rgb.length);
  for (let i = 0; i < rgb.length; i += 3) {
    const r = toByte(LINEAR[rgb[i]] * gains[0]);
    const g = toByte(LINEAR[rgb[i + 1]] * gains[1]);
    const b = toByte(LINEAR[rgb[i + 2]] * gains[2]);
    const y = luma(r, g, b);
    out[i] = y + (r - y) * LIFT;
    out[i + 1] = y + (g - y) * LIFT;
    out[i + 2] = y + (b - y) * LIFT;
  }
  return out;
}
