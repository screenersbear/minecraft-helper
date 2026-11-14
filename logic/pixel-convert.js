// Photo to pixel art, all the steps (the "Turn it into blocks" step in HANDOFF.md): a simple cartoon with big flat
// shapes, not a copy of the photo. 1 smooth, 2 find the background, 3 fix the light (white balance), 4 crop tight
// to the thing, 5 colour groups by hue (how many is picked automatically), 6 shrink to the grid (the most common
// colour in each square), 7 clean up, 8 one block for each colour group, 9 the outline, 10 the kid's own changes.
// Steps 1 to 5 don't depend on the size, so prepare() does them once and blocksFrom() makes any size from that.
import { toRgb, smooth } from './pixel-smooth.js';
import { halfLightLab, labPicture, choices, nearest } from './pixel.js';
import { findBackground } from './pixel-background.js';
import { fixLight } from './pixel-light.js';
import { thingBox, squareAround, isRound } from './pixel-subject.js';
import { kMeans } from './pixel-colours.js';
import { joinShades } from './pixel-shades.js';
import { startingSize } from './pixel-size.js';
import { cellModes, cleanUp, outlineSquares } from './pixel-grid.js';

export const WORK = 256; // the photo is looked at 256 by 256 pixels
export const WHOLE = { x: 0, y: 0, side: 1 }; // all of the photo, as a part of it
const ROOM = 1.5; // a close-up shows the thing and half as much again around it
const CLOSE = 0.8; // a close-up is only worth it if it's smaller than this much of the photo
export const COLOURS = { fewest: 1, most: 12 };
const PIECES = 12; // the thing is first cut into this many colours, which then join into groups by hue
const DARKEST = 0x1d1d21;

// The settings a kid can change. Anything missing gets its usual value; colours null means "pick for me".
export function lookOf(art = {}) {
  const colours = Math.round(Number(art.colours));
  return {
    colours: colours >= COLOURS.fewest && colours <= COLOURS.most ? colours : null,
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

// Steps 1 to 5. data: the square photo as RGBA, width by width (WORK works best). Returns what blocksFrom needs:
// the photo with the light fixed, the background (mask: 1 for each background pixel, or null), the box around the
// thing, whether it's round, and the thing cut into small colour pieces (each pixel's piece, their colours, sizes).
export function prepare(data, width) {
  const smoothed = smooth(toRgb(data), width);
  const mask = findBackground(halfLightLab(smoothed), width)?.mask || null;
  const rgb = fixLight(smoothed, mask);
  const box = mask ? thingBox(mask, width) : null;
  const lab = labPicture(rgb);
  const thing = [];
  for (let p = 0; p < width * width; p++) if (!mask?.[p]) thing.push(p);
  const pieces = kMeans(lab, thing, PIECES);
  const count = pieces.length ? Math.max(...pieces) + 1 : 0;
  const sums = Array.from({ length: count }, () => [0, 0, 0, 0]);
  thing.forEach((p, i) => {
    const s = sums[pieces[i]];
    for (let c = 0; c < 3; c++) s[c] += lab[p * 3 + c];
    s[3] += 1;
  });
  const centres = sums.map((s) => [s[0] / s[3], s[1] / s[3], s[2] / s[3]]);
  const counts = sums.map((s) => s[3]);
  return { width, rgb, mask, box, round: isRound(mask, width, box), thing, pieces, centres, counts };
}

// The part of the photo to look at again, close up: the thing and some room around it ({ x, y, side } as fractions
// of the photo), or null if the thing already fills most of it. box: around the thing, in pixels (width across).
export function closeUp(box, width) {
  if (!box) return null;
  const side = Math.min(width, Math.round(Math.max(box.x1 - box.x0, box.y1 - box.y0) * ROOM));
  if (side > width * CLOSE) return null;
  const place = (from, to) => Math.min(width - side, Math.max(0, Math.round((from + to - side) / 2)));
  return { x: place(box.x0, box.x1) / width, y: place(box.y0, box.y1) / width, side: side / width };
}

// Steps 1 to 5, looking twice: once at the whole photo to find the thing, then again close up at just the thing
// (read from the photo again, so a small thing keeps its detail instead of going blurry). read(part) gives the
// pixels of a part of the photo, WORK by WORK (or a promise of them). The result says which part it used.
export async function prepareClose(read) {
  const whole = { ...prepare(await read(WHOLE), WORK), part: WHOLE };
  const part = closeUp(whole.box, WORK);
  if (!part) return whole;
  const close = prepare(await read(part), WORK);
  return close.box ? { ...close, part } : whole;
}

// The colour groups for some number of colours (null: picked automatically). Returns a group for every pixel
// (labels), the background's group (or -1), how many groups there are with the background, and the colour counts:
// colours (used), auto (picked automatically), most (the most there can be).
export function colourGroups(prep, wanted = null) {
  const { groupOf, colours, auto, most } = joinShades(prep.centres, prep.counts, wanted);
  const labels = new Int16Array(prep.width * prep.width).fill(colours);
  prep.thing.forEach((p, i) => {
    labels[p] = groupOf[prep.pieces[i]];
  });
  const background = prep.mask ? colours : -1;
  return { labels, background, groups: colours + (prep.mask ? 1 : 0), colours, auto, most };
}

// The size to start at (the smallest where the thing's parts are 2 blocks wide), and whether it's round.
export function suggestSize(prep) {
  const { labels, background } = colourGroups(prep);
  return { size: startingSize(prep.mask, labels, prep.width, prep.box, background), round: prep.round };
}

// Steps 6 to 10, for one size. palette: the book's block colours. Returns { blocks: block ids, cells: a place in
// blocks for each square, background: true if one was found, colours, autoColours, mostColours }.
export function blocksFrom(prep, size, palette, art = {}) {
  const look = lookOf(art);
  const { labels, background, groups, colours, auto, most } = colourGroups(prep, look.colours);
  const square = squareAround(prep.box, prep.width, size);
  const grid = cleanUp(cellModes(labels, prep.width, size, square), size);

  // One block for each group: the closest flat-coloured block, then the kid's swaps.
  const list = choices(palette, look.woolOnly);
  const swap = (id) => look.swaps[id] || id;
  const groupRgb = groupColours(prep.rgb, labels, groups);
  const closest = standOut(groupRgb.map((colour) => list[nearest(colour, list)].id), groupRgb, background, list);
  const blockOf = sameColourOnce(closest, grid, background).map(swap);
  const ids = Array.from(grid, (g) => blockOf[g]);
  if (look.outline && background >= 0) {
    const dark = swap(list[nearest(DARKEST, list)].id);
    for (const i of outlineSquares(grid, size, background)) ids[i] = dark;
  }
  for (const [i, id] of Object.entries(look.edits)) if (Number(i) < ids.length) ids[Number(i)] = id;
  return { ...toBlocks(ids), background: background >= 0, colours, autoColours: auto, mostColours: most };
}

// All the steps at once.
export const convert = (data, width, size, palette, art = {}) => blocksFrom(prepare(data, width), size, palette, art);

// The colour part of a block id: 'orange_wool' -> 'orange'.
export const colourName = (id) => id.replace(/_(wool|concrete|terracotta)$/, '');

// The thing never gets the background's colour of block (a pale cookie on a white table would vanish into it): a
// group that would takes the closest block of another colour. closest: a block id for each group. colours: each
// group's colour (0xRRGGBB). list: the blocks to choose from (see choices in pixel.js).
export function standOut(closest, colours, background, list) {
  if (background < 0) return closest;
  const behind = colourName(closest[background]);
  const others = list.filter((b) => colourName(b.id) !== behind);
  if (!others.length) return closest;
  return closest.map((id, g) => (g !== background && colourName(id) === behind ? others[nearest(colours[g], others)].id : id));
}

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
