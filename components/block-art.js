// Block art: a pixel art drawn with the block pictures themselves (white wool looks like wool), one picture per
// square. While building, rows already done are faded and the row being built has a box around it.
import { el } from './el.js';

let atlas = null;
const loadAtlas = () => {
  if (!atlas) {
    const img = new Image();
    img.src = 'images/items.png';
    atlas = img.decode().then(() => img);
  }
  return atlas;
};

const CELL = 16;
const PAD = 5; // room around the picture for the row's outline

// The square under a tap or click on the picture, or -1 for the edge around it.
export function squareAt(canvas, size, event) {
  const box = canvas.getBoundingClientRect();
  const scale = canvas.width / (box.width || 1);
  const col = Math.floor(((event.clientX - box.left) * scale - PAD) / CELL);
  const row = Math.floor(((event.clientY - box.top) * scale - PAD) / CELL);
  return col >= 0 && row >= 0 && col < size && row < size ? row * size + col : -1;
}

// art: { size, blocks, cells }. done: rows finished (from the bottom). current: the row being built, or 0.
// picked: a square to box (the one being changed), or -1. onTap(square): makes the squares tappable.
export function blockArt(book, art, { done = 0, current = 0, picked = -1, onTap = null } = {}) {
  const px = art.size * CELL;
  const canvas = el('canvas', { class: `block-art${onTap ? ' tappable' : ''}`, width: px + PAD * 2, height: px + PAD * 2, role: 'img', 'aria-label': `The picture in blocks, ${art.size} by ${art.size}` });
  if (onTap) {
    canvas.addEventListener('click', (e) => {
      const square = squareAt(canvas, art.size, e);
      if (square >= 0) onTap(square);
    });
  }
  const c = canvas.getContext('2d');
  if (!c) return canvas;
  const colour = new Map(book.palette.map((p) => [p.id, p.rgb]));
  const { columns, cell } = book.atlas;
  const draw = (img) => {
    c.clearRect(0, 0, px + PAD * 2, px + PAD * 2);
    art.cells.forEach((b, i) => {
      const id = art.blocks[b];
      const x = PAD + (i % art.size) * CELL;
      const y = PAD + Math.floor(i / art.size) * CELL;
      const rowFromBottom = art.size - Math.floor(i / art.size);
      c.globalAlpha = rowFromBottom <= done ? 0.3 : 1;
      const pic = book.items[id]?.pic;
      if (img && pic >= 0) {
        c.drawImage(img, (pic % columns) * cell + 1, Math.floor(pic / columns) * cell + 1, 16, 16, x, y, CELL, CELL);
      } else {
        c.fillStyle = `#${(colour.get(id) ?? 0x8b8b8b).toString(16).padStart(6, '0')}`;
        c.fillRect(x, y, CELL, CELL);
      }
    });
    c.globalAlpha = 1;
    // The row being built, or the square being changed: a mango line with dark edges just outside it, easy to
    // see on any colour.
    const ring = (x, y, w, h) => {
      c.lineWidth = 5;
      c.strokeStyle = '#313d45';
      c.strokeRect(x - 2.5, y - 2.5, w + 5, h + 5);
      c.lineWidth = 2;
      c.strokeStyle = '#ffd100';
      c.strokeRect(x - 2.5, y - 2.5, w + 5, h + 5);
    };
    if (current) ring(PAD, PAD + (art.size - current) * CELL, px, CELL);
    if (picked >= 0) ring(PAD + (picked % art.size) * CELL, PAD + Math.floor(picked / art.size) * CELL, CELL, CELL);
  };
  draw(null);
  loadAtlas().then(draw, () => {});
  return canvas;
}
