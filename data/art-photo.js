// A pixel art's saved photo as pixels (RGBA, width by width), so the blocks can be made again with other settings.
// Everything stays on the phone.
export async function photoPixels(src, width) {
  const img = new Image();
  img.src = src;
  await img.decode();
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = width;
  const c = canvas.getContext('2d', { willReadFrequently: true });
  c.imageSmoothingEnabled = true;
  c.imageSmoothingQuality = 'high';
  c.drawImage(img, 0, 0, width, width);
  return c.getImageData(0, 0, width, width).data;
}
