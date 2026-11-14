// Photo to pixel art, all the steps: a simple cartoon with big flat shapes, not a copy of the photo.
// 1 smooth, 2 find the background, 3 cut the thing down to a few colours, 4 shrink to the grid (most common colour
// in each square), 5 clean up, 6 one block for each colour, 7 the outline, 8 the kid's own changes.
import { toRgb, smooth } from './pixel-smooth.js';
import { halfLightLab, choices, nearest } from './pixel.js';
import { findBackground } from './pixel-background.js';
import { kMeans } from './pixel-colours.js';
import { cellModes, cleanUp, outlineSquares } from './pixel-grid.js';

export const DETAIL = 6; // the photo is looked at 6 by 6 pixels per block
export const COLOURS = { fewest: 2, most: 8, start: 4 };
const DARKEST = 0x1d1d21;

// The settings a kid can change. Anything missing gets its usual value.
export function lookOf(art = {}) {
  const colours = Math.round(Number(art.colours));
  return {
    colours: colours >= COLOURS.fewest && colours <= COLOURS.most ? colours : COLOURS.start,
    outline: Boolean(art.outline),
    woolOnly: Boolean(art.woolOnly),
    edits: art.edits && typeof art.edits === 'object' ? art.edits : {},
    swaps: art.swaps && typeof art.swaps === 'object' ? art.swaps : {},
  };
}

const brightness = (rgb, p) => 0.2126 * rgb[p * 3] + 0.7152 * rgb[p * 3 + 1] + 0.0722 * rgb[p * 3 + 2];

// Each group's colour as 0xRRGGBB: the average of its lighter half, the side the light falls on, so a red thing
// with a shadow still looks red (the colour you'd name it), not dark red.
export function groupColours(rgb, labels, groups) {
  const lights = Array.from({ length: groups }, () => []);
  labels.forEach((g, p) => lights[g].push(brightness(rgb, p)));
  const middle = lights.map((l) => (l.length ? l.sort((a, b) => a - b)[Math.floor(l.length / 2)] : 0));
  const sums = Array.from({ length: groups }, () => [0, 0, 0, 0]);
  labels.forEach((g, p) => {
    if (brightness(rgb, p) < middle[g]) return;
    const s = sums[g];
    for (let c = 0; c < 3; c++) s[c] += rgb[p * 3 + c];
    s[3] += 1;
  });
  return sums.map((s) => {
    const avg = (v) => Math.round(v / Math.max(1, s[3]));
    return (avg(s[0]) << 16) | (avg(s[1]) << 8) | avg(s[2]);
  });
}

// The photo's colour groups: a group number for every pixel, the background's number (or -1), and how many groups.
export function colourGroups(rgb, width, colours) {
  const lab = halfLightLab(rgb);
  const background = findBackground(lab, width);
  const thing = [];
  for (let p = 0; p < width * width; p++) if (!background?.mask[p]) thing.push(p);
  const found = kMeans(lab, thing, colours);
  const groups = found.length ? Math.max(...found) + 1 : 0;
  const labels = new Int16Array(width * width).fill(groups);
  thing.forEach((p, i) => {
    labels[p] = found[i];
  });
  return { labels, background: background ? groups : -1, groups: groups + (background ? 1 : 0) };
}

// data: the square photo as RGBA, width by width (width = size * DETAIL works best). palette: the book's block
// colours. Returns { blocks: block ids, cells: a place in blocks for each square, background: true if one was found }.
export function convert(data, width, size, palette, art = {}) {
  const look = lookOf(art);
  const rgb = smooth(toRgb(data), width);
  const { labels, background, groups } = colourGroups(rgb, width, look.colours);
  const grid = cleanUp(cellModes(labels, width, size), size);

  // One block for each group: the closest flat-coloured block, then the kid's swaps.
  const list = choices(palette, look.woolOnly);
  const swap = (id) => look.swaps[id] || id;
  const closest = groupColours(rgb, labels, groups).map((colour) => list[nearest(colour, list)].id);
  const blockOf = sameColourOnce(closest, grid, background).map(swap);
  const ids = Array.from(grid, (g) => blockOf[g]);
  if (look.outline && background >= 0) {
    const dark = swap(list[nearest(DARKEST, list)].id);
    for (const i of outlineSquares(grid, size, background)) ids[i] = dark;
  }
  for (const [i, id] of Object.entries(look.edits)) if (Number(i) < ids.length) ids[Number(i)] = id;
  return { ...toBlocks(ids), background: background >= 0 };
}

// The colour part of a block id: 'orange_wool' -> 'orange'.
export const colourName = (id) => id.replace(/_(wool|concrete|terracotta)$/, '');

// Lit and shaded parts of one thing often land on two blocks of the same colour (orange concrete and orange wool).
// Those groups all take the block of the one with the most squares. The background keeps its own block.
// blockOf: a block id for each group. grid: a group for each square.
export function sameColourOnce(blockOf, grid, background = -1) {
  const squares = blockOf.map(() => 0);
  for (const g of grid) squares[g] += 1;
  const biggest = new Map();
  blockOf.forEach((id, g) => {
    if (g === background) return;
    const name = colourName(id);
    const best = biggest.get(name);
    if (best === undefined || squares[g] > squares[best]) biggest.set(name, g);
  });
  return blockOf.map((id, g) => (g === background ? id : blockOf[biggest.get(colourName(id))]));
}

// A block id for each square -> { blocks: each id once, cells: a place in blocks for each square }.
export function toBlocks(ids) {
  const blocks = [];
  const place = new Map();
  const cells = ids.map((id) => {
    if (!place.has(id)) {
      place.set(id, blocks.length);
      blocks.push(id);
    }
    return place.get(id);
  });
  return { blocks, cells };
}
