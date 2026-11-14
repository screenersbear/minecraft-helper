// The thing in the photo, once the background is found: where it is, so the grid is cropped tight around it with
// one block of space on each side (it fills the picture instead of sitting small in the middle), and whether it's
// round (curves come out as steps, so round things look better bigger).
// Pictures are width by width; mask has 1 for each background pixel.

const STRAY = 0.005; // the outermost 0.5% of the thing's pixels on each side are left out (specks, not the thing)
const ROUND = 0.85; // how closely the thing must fill an oval to count as round

// The box around the thing: { x0, y0, x1, y1 } (x1 and y1 just past it), or null if there's no thing.
export function thingBox(mask, width) {
  const rows = new Float64Array(width);
  const cols = new Float64Array(width);
  let total = 0;
  for (let p = 0; p < mask.length; p++) {
    if (mask[p]) continue;
    rows[Math.floor(p / width)] += 1;
    cols[p % width] += 1;
    total += 1;
  }
  if (!total) return null;
  const from = (counts) => {
    let seen = 0;
    for (let i = 0; i < width; i++) if ((seen += counts[i]) > total * STRAY) return i;
    return 0;
  };
  const to = (counts) => {
    let seen = 0;
    for (let i = width - 1; i >= 0; i--) if ((seen += counts[i]) > total * STRAY) return i + 1;
    return width;
  };
  return { x0: from(cols), y0: from(rows), x1: to(cols), y1: to(rows) };
}

// The square of the photo to turn into size by size blocks: the thing's box, made square, with one block of space
// on each side, kept inside the photo. { x, y, side } in pixels. Without a box, the whole photo.
export function squareAround(box, width, size) {
  if (!box) return { x: 0, y: 0, side: width };
  const thing = Math.max(box.x1 - box.x0, box.y1 - box.y0, 1);
  const wanted = size > 2 ? (thing * size) / (size - 2) : thing;
  const side = Math.min(width, Math.max(Math.round(wanted), Math.min(width, size * 2)));
  const place = (from, to) => Math.min(width - side, Math.max(0, Math.round((from + to - side) / 2)));
  return { x: place(box.x0, box.x1), y: place(box.y0, box.y1), side };
}

// Whether the thing is round (a ball, a cookie): it covers nearly all of the oval that fits its box, and little
// outside it.
export function isRound(mask, width, box) {
  if (!box) return false;
  const cx = (box.x0 + box.x1) / 2;
  const cy = (box.y0 + box.y1) / 2;
  const rx = (box.x1 - box.x0) / 2;
  const ry = (box.y1 - box.y0) / 2;
  if (rx < 2 || ry < 2) return false;
  let both = 0;
  let either = 0;
  for (let y = box.y0; y < box.y1; y++) {
    for (let x = box.x0; x < box.x1; x++) {
      const inOval = ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1;
      const inThing = !mask[y * width + x];
      if (inOval && inThing) both += 1;
      if (inOval || inThing) either += 1;
    }
  }
  return either > 0 && both / either >= ROUND;
}
