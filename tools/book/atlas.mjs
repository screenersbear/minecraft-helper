// Packs every picture into one image (images/items.png) so the app loads one file instead of hundreds.
// Each picture is 16 by 16 inside an 18 by 18 cell (a clear 1 pixel edge keeps neighbours from bleeding in).
import { readFileSync, writeFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import { SHAPES } from './textures.mjs';

export const CELL = 18;
export const COLUMNS = 32;

const load = (file) => PNG.sync.read(readFileSync(file));

function hex(color) {
  const n = parseInt(color.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// A 16x16 RGBA picture from a texture: the first animation frame, shrunk if the pack drew it bigger.
function square(png, crop) {
  const out = new Uint8Array(16 * 16 * 4);
  const { x, y, w, h } = crop || { x: 0, y: 0, w: png.width, h: png.width };
  const big = Math.max(w, h);
  const scale = crop ? (big > 16 ? 16 / big : Math.floor(16 / big)) : 1;
  const shrink = crop ? 1 : w / 16;
  const offX = crop ? Math.floor((16 - Math.round(w * scale)) / 2) : 0;
  const offY = crop ? Math.floor((16 - Math.round(h * scale)) / 2) : 0;
  for (let ty = 0; ty < 16; ty++) {
    for (let tx = 0; tx < 16; tx++) {
      const sx = crop ? Math.floor((tx - offX) / scale) : Math.floor(tx * shrink);
      const sy = crop ? Math.floor((ty - offY) / scale) : Math.floor(ty * shrink);
      if (sx < 0 || sy < 0 || sx >= w || sy >= h) continue;
      const from = ((y + sy) * png.width + (x + sx)) * 4;
      const to = (ty * 16 + tx) * 4;
      for (let c = 0; c < 4; c++) out[to + c] = png.data[from + c];
    }
  }
  return out;
}

function applyTint(pixels, color) {
  const [r, g, b] = hex(color);
  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i] = (pixels[i] * r) / 255;
    pixels[i + 1] = (pixels[i + 1] * g) / 255;
    pixels[i + 2] = (pixels[i + 2] * b) / 255;
  }
}

// Grey it out, then colour it: used to make newer woods from oak.
function applyRecolor(pixels, color) {
  const [r, g, b] = hex(color);
  for (let i = 0; i < pixels.length; i += 4) {
    const light = Math.min(1.25, ((0.3 * pixels[i] + 0.59 * pixels[i + 1] + 0.11 * pixels[i + 2]) / 255) * 1.7);
    pixels[i] = Math.min(255, r * light);
    pixels[i + 1] = Math.min(255, g * light);
    pixels[i + 2] = Math.min(255, b * light);
  }
}

function applyShape(pixels, name) {
  const mask = SHAPES[name];
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (!mask[y][x]) pixels[(y * 16 + x) * 4 + 3] = 0;
}

// One picture from a spec: { file, shape?, tint?, crop? }.
export function picture(spec) {
  const pixels = square(load(spec.file), spec.crop);
  if (spec.tint) applyTint(pixels, spec.tint);
  if (spec.recolor) applyRecolor(pixels, spec.recolor);
  if (spec.shape) applyShape(pixels, spec.shape);
  return pixels;
}

// Writes the atlas. specs is a list in index order. Returns the atlas size.
export function writeAtlas(specs, outFile) {
  const rows = Math.ceil(specs.length / COLUMNS);
  const png = new PNG({ width: COLUMNS * CELL, height: rows * CELL });
  png.data.fill(0);
  specs.forEach((spec, i) => {
    const pixels = picture(spec);
    const ox = (i % COLUMNS) * CELL + 1;
    const oy = Math.floor(i / COLUMNS) * CELL + 1;
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const to = ((oy + y) * png.width + ox + x) * 4;
        for (let c = 0; c < 4; c++) png.data[to + c] = pixels[(y * 16 + x) * 4 + c];
      }
    }
  });
  writeFileSync(outFile, PNG.sync.write(png, { colorType: 6 }));
  return { width: png.width, height: png.height, columns: COLUMNS, cell: CELL };
}
