// The block colours pixel art is made from: the 16 wool, 16 concrete and 16 terracotta colours. Each block's colour
// is the average of its Pixel Perfection picture, stored as one number (0xRRGGBB), so the app matches a photo to
// the same pictures it draws the result with.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { PNG } from 'pngjs';

export const COLOURS = [
  'white', 'light_gray', 'gray', 'black', 'brown', 'red', 'orange', 'yellow',
  'lime', 'green', 'cyan', 'light_blue', 'blue', 'purple', 'magenta', 'pink',
];
export const KINDS = ['wool', 'concrete', 'terracotta'];

// The average colour of a picture's first 16 by 16 frame, as 0xRRGGBB.
function averageColour(file) {
  const png = PNG.sync.read(readFileSync(file));
  const size = png.width;
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * png.width + x) * 4;
      if (png.data[i + 3] < 128) continue;
      r += png.data[i];
      g += png.data[i + 1];
      b += png.data[i + 2];
      n += 1;
    }
  }
  const avg = (v) => Math.round(v / Math.max(1, n));
  return (avg(r) << 16) | (avg(g) << 8) | avg(b);
}

// pack: the Pixel Perfection folder. Returns [{ id: 'white_wool', rgb: 0xE9ECEC }] for every block it has a picture of.
export function buildPalette(pack) {
  const out = [];
  for (const kind of KINDS) {
    for (const colour of COLOURS) {
      const id = `${colour}_${kind}`;
      const file = join(pack, 'assets/minecraft/textures/block', `${id}.png`);
      if (existsSync(file)) out.push({ id, rgb: averageColour(file) });
    }
  }
  return out;
}
