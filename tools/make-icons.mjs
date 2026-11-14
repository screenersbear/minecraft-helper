// Make the Home Screen icons: the Pixel Perfection CE book picture, scaled up with square pixels, on mango.
// Writes images/icon-180.png (iPhone), icon-192.png, icon-512.png and icon-maskable-512.png (Android).
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { PNG } from 'pngjs';

const app = fileURLToPath(new URL('..', import.meta.url));
const book = PNG.sync.read(readFileSync(join(app, '.cache/ppce/assets/minecraft/textures/item/book.png')));
const MANGO = [0xff, 0xd1, 0x00];

// size: the icon in pixels. scale: how big each picture pixel gets.
function icon(size, scale) {
  const png = new PNG({ width: size, height: size });
  const offset = Math.floor((size - book.width * scale) / 2);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const bx = Math.floor((x - offset) / scale);
      const by = Math.floor((y - offset) / scale);
      let rgb = MANGO;
      if (bx >= 0 && by >= 0 && bx < book.width && by < book.height) {
        const j = (by * book.width + bx) * 4;
        const a = book.data[j + 3] / 255;
        rgb = MANGO.map((m, k) => Math.round(book.data[j + k] * a + m * (1 - a)));
      }
      png.data.set([...rgb, 255], i);
    }
  }
  return PNG.sync.write(png);
}

const ICONS = { 'icon-180.png': [180, 7], 'icon-192.png': [192, 8], 'icon-512.png': [512, 22], 'icon-maskable-512.png': [512, 16] };
for (const [file, [size, scale]] of Object.entries(ICONS)) writeFileSync(join(app, 'images', file), icon(size, scale));
console.log(`icons: ${Object.keys(ICONS).join(', ')}`);
