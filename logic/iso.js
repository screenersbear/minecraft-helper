// Draws a build's faces as a small 3D picture (isometric, seen from the front right and above), one pixel at a
// time, into an RGBA array a canvas can show. s: screen pixels for each pixel of a block's picture (a block is 16).
// atlas: { data, width } of the block pictures, 16 by 16 each, in rows. Nearer faces cover farther ones (each
// pixel remembers how near it is); see-through faces (glass and water) are drawn last, farthest first.

export function isoSize(W, H, D, s) {
  return { width: Math.ceil((W + D) * 16 * s), height: Math.ceil(((W + D) * 8 + H * 16) * s) };
}

// How light each face is: the top in full light, the front a little darker, the right side darker again.
const SHADE = { top: 1, front: 0.8, right: 0.64 };
const clamp16 = (n) => (n < 0 ? 0 : n > 15 ? 15 : n | 0);

// For a screen point (p, q) in block-picture units: where it lands on the face, how near it is (bigger is nearer),
// and the spot on the face's picture (u, v); or null when the point misses the face.
export function hit(f, p, q) {
  if (f.kind === 'top') {
    const X = q + f.c + p / 2;
    const Z = q + f.c - p / 2;
    if (X < f.a0 || X >= f.a1 || Z < f.b0 || Z >= f.b1) return null;
    return { d: X + f.c + Z, u: X - f.bx, v: Z - f.bz };
  }
  if (f.kind === 'front') {
    const X = p + f.c;
    const Y = (X + f.c) / 2 - q;
    if (X < f.a0 || X >= f.a1 || Y <= f.b0 || Y > f.b1) return null;
    return { d: X + Y + f.c, u: X - f.bx, v: f.by + 16 - Y };
  }
  const Z = f.c - p;
  const Y = (f.c + Z) / 2 - q;
  if (Z <= f.a0 || Z > f.a1 || Y <= f.b0 || Y > f.b1) return null;
  return { d: f.c + Y + Z, u: f.bz + 16 - Z, v: f.by + 16 - Y };
}

// The face's corners on screen (block-picture units), to know which pixels to try.
export function cornersOf(f) {
  const pts = [];
  for (const a of [f.a0, f.a1]) for (const b of [f.b0, f.b1]) {
    if (f.kind === 'top') pts.push([a - b, (a + b) / 2 - f.c]);
    else if (f.kind === 'front') pts.push([a - f.c, (a + f.c) / 2 - b]);
    else pts.push([f.c - a, (f.c + a) / 2 - b]);
  }
  return pts;
}

// A flat picture standing up, facing you: 16 wide and 16 tall, centred on its block.
export function hitSprite(sp, p, q) {
  const u = p - (sp.x - sp.z) + 8;
  const Y = (sp.x + sp.z) / 2 - q;
  const v = sp.y + 16 - Y;
  if (u < 0 || u >= 16 || v < 0 || v >= 16) return null;
  return { d: sp.x + sp.z + Y, u, v };
}

export function drawScene(scene, s, atlas) {
  const { width, height } = isoSize(scene.W, scene.H, scene.D, s);
  const data = new Uint8ClampedArray(width * height * 4);
  const near = new Float32Array(width * height).fill(-Infinity);
  const ox = scene.D * 16 * s;
  const oy = scene.H * 16 * s;
  const cols = Math.max(1, Math.floor(atlas.width / 16));
  const texel = (tile, u, v) => {
    const tx = (tile % cols) * 16 + clamp16(u);
    const ty = Math.floor(tile / cols) * 16 + clamp16(v);
    return (ty * atlas.width + tx) * 4;
  };
  // Tries every pixel in the box (x0..x1, y0..y1 in block-picture units) against find(p, q).
  const each = (pts, find, put) => {
    const xs = pts.map((pt) => pt[0] * s + ox);
    const ys = pts.map((pt) => pt[1] * s + oy);
    const left = Math.max(0, Math.floor(Math.min(...xs)));
    const right = Math.min(width, Math.ceil(Math.max(...xs)));
    const top = Math.max(0, Math.floor(Math.min(...ys)));
    const bottom = Math.min(height, Math.ceil(Math.max(...ys)));
    for (let py = top; py < bottom; py++) {
      for (let px = left; px < right; px++) {
        const at = find((px + 0.5 - ox) / s, (py + 0.5 - oy) / s);
        if (at) put(py * width + px, at);
      }
    }
  };
  // Solid pixels: a see-through spot in the picture (between glass edges, around a flower) shows what's behind.
  const solid = (tile, shade) => (i, at) => {
    if (at.d < near[i]) return;
    const t = texel(tile, at.u, at.v);
    if (atlas.data[t + 3] < 128) return;
    near[i] = at.d;
    for (let k = 0; k < 3; k++) data[i * 4 + k] = atlas.data[t + k] * shade;
    data[i * 4 + 3] = 255;
  };
  // See-through pixels (glass and water): mixed over what's already there.
  const clear = (tile, shade, alpha) => (i, at) => {
    if (at.d < near[i]) return;
    const t = texel(tile, at.u, at.v);
    const a = (atlas.data[t + 3] / 255) * alpha;
    const under = data[i * 4 + 3] / 255;
    const all = a + under * (1 - a);
    if (all <= 0) return;
    for (let k = 0; k < 3; k++) data[i * 4 + k] = (atlas.data[t + k] * shade * a + data[i * 4 + k] * under * (1 - a)) / all;
    data[i * 4 + 3] = all * 255;
  };
  const solidFaces = scene.faces.filter((f) => !f.clear);
  const seeThrough = scene.faces.filter((f) => f.clear).sort((a, b) => a.bx + a.by + a.bz - (b.bx + b.by + b.bz));
  for (const f of solidFaces) each(cornersOf(f), (p, q) => hit(f, p, q), solid(f.tile, SHADE[f.kind]));
  for (const sp of scene.sprites) {
    const pts = [[sp.x - sp.z - 8, (sp.x + sp.z) / 2 - sp.y], [sp.x - sp.z + 8, (sp.x + sp.z) / 2 - sp.y - 16]];
    each(pts, (p, q) => hitSprite(sp, p, q), solid(sp.tile, 1));
  }
  for (const f of seeThrough) each(cornersOf(f), (p, q) => hit(f, p, q), clear(f.tile, SHADE[f.kind], f.alpha));
  return { width, height, data };
}

// The scale that makes the picture about `wide` pixels across.
export const scaleFor = (scene, wide) => wide / ((scene.W + scene.D) * 16);
