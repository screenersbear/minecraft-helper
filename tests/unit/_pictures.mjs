// Made-up photos for the pixel art tests: a square picture with shapes drawn on a background.
// Colours are 0xRRGGBB. Returns RGBA (like a canvas) or RGB.
export function picture(width, background, shapes = []) {
  const rgba = new Uint8ClampedArray(width * width * 4);
  for (let y = 0; y < width; y++) {
    for (let x = 0; x < width; x++) {
      let colour = background;
      for (const s of shapes) if (s.inside(x, y)) colour = s.colour;
      const i = (y * width + x) * 4;
      rgba[i] = (colour >> 16) & 255;
      rgba[i + 1] = (colour >> 8) & 255;
      rgba[i + 2] = colour & 255;
      rgba[i + 3] = 255;
    }
  }
  return rgba;
}
export const circle = (cx, cy, r, colour) => ({ colour, inside: (x, y) => (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r });
export const rect = (x0, y0, x1, y1, colour) => ({ colour, inside: (x, y) => x >= x0 && x < x1 && y >= y0 && y < y1 });
export function rgbOf(rgba) {
  const out = new Uint8ClampedArray((rgba.length / 4) * 3);
  for (let i = 0; i < rgba.length / 4; i++) for (let c = 0; c < 3; c++) out[i * 3 + c] = rgba[i * 4 + c];
  return out;
}
