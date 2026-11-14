// A pixel art's saved photo as pixels (RGBA, width by width), so the blocks can be made again with other settings.
// part: a part of the photo ({ x, y, side } as fractions), or all of it. Everything stays on the phone.
export async function photoPixels(src, width, part = { x: 0, y: 0, side: 1 }) {
  const img = new Image();
  img.src = src;
  await img.decode();
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = width;
  const c = canvas.getContext('2d', { willReadFrequently: true });
  c.imageSmoothingEnabled = true;
  c.imageSmoothingQuality = 'high';
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  c.drawImage(img, part.x * w, part.y * h, part.side * w, part.side * h, 0, 0, width, width);
  return c.getImageData(0, 0, width, width).data;
}
