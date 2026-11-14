// A small picture of a pixel art: one dot of colour per block, made bigger with sharp pixels.
import { el } from './el.js';

// art: { size, blocks, cells }. book: for each block's colour. px: how big to show it (CSS pixels).
export function artThumb(book, art, px = 48) {
  const canvas = el('canvas', { class: 'art-thumb', width: art.size, height: art.size, 'aria-hidden': 'true', style: { width: `${px}px`, height: `${px}px` } });
  const ctx2d = canvas.getContext('2d');
  if (!ctx2d) return canvas;
  const colour = new Map(book.palette.map((p) => [p.id, p.rgb]));
  const image = ctx2d.createImageData(art.size, art.size);
  art.cells.forEach((b, i) => {
    const rgb = colour.get(art.blocks[b]) ?? 0x8b8b8b;
    image.data.set([(rgb >> 16) & 255, (rgb >> 8) & 255, rgb & 255, 255], i * 4);
  });
  ctx2d.putImageData(image, 0, 0);
  return canvas;
}
