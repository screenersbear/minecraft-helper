import './_setup.mjs';
import { describe, it, expect } from 'vitest';
import { edgePixels, findBackground } from '../../logic/pixel-background.js';
import { thingBox, squareAround, isRound } from '../../logic/pixel-subject.js';
import { SIZES, edgeDistance, thinShare, shapeSize, partWidths, partsSize, startingSize } from '../../logic/pixel-size.js';
import { cellModes, sides, majority, patches, removeIslands, cleanUp, outlineSquares } from '../../logic/pixel-grid.js';
import { halfLightLab } from '../../logic/pixel.js';
import { rowCells, rowRuns, blockCounts, rowSentence, countText } from '../../logic/pixel-rows.js';
import { realData } from './_setup.mjs';
import { picture, circle, rect, rgbOf } from './_pictures.mjs';

const W = 32;
const labOfPic = (rgba) => halfLightLab(rgbOf(rgba));
// A mask from a picture: 1 where it's the background colour.
const maskOf = (width, inside) => Uint8Array.from({ length: width * width }, (_, p) => (inside(p % width, Math.floor(p / width)) ? 0 : 1));

describe('edgePixels', () => {
  it('every edge pixel once', () => {
    expect(edgePixels(3).sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 5, 6, 7, 8]);
    expect(new Set(edgePixels(10)).size).toBe(36);
  });
  it('tiny pictures', () => {
    expect(edgePixels(1)).toEqual([0]);
    expect(edgePixels(2).sort()).toEqual([0, 1, 2, 3]);
  });
});

describe('findBackground', () => {
  it('a red ball on a white table', () => {
    const lab = labOfPic(picture(W, 0xffffff, [circle(16, 16, 8, 0xdd2222)]));
    const { mask, colour } = findBackground(lab, W);
    expect(mask[0]).toBe(1);
    expect(mask[16 * W + 16]).toBe(0);
    expect(edgePixels(W)).toContain(colour);
  });
  it('the fill stops at edges but goes through gentle shading', () => {
    const shapes = [rect(0, 0, W, W / 2, 0xf4f4f4), circle(16, 16, 6, 0x2222aa)];
    const { mask } = findBackground(labOfPic(picture(W, 0xffffff, shapes)), W);
    expect(mask[2 * W + 2]).toBe(1);
    expect(mask[30 * W + 30]).toBe(1);
    expect(mask[16 * W + 16]).toBe(0);
  });
  it('a thing touching the edge is not background', () => {
    const { mask } = findBackground(labOfPic(picture(W, 0xffffff, [rect(0, 10, 4, 20, 0x2222aa)])), W);
    expect(mask[15 * W]).toBe(0);
    expect(mask[0]).toBe(1);
  });
  it('no clear background when the edge is all different colours', () => {
    const stripes = Array.from({ length: 8 }, (_, i) => rect(i * 4, 0, i * 4 + 4, W, [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff, 0x000000, 0x888888][i]));
    expect(findBackground(labOfPic(picture(W, 0xffffff, stripes)), W)).toBe(null);
  });
  it('a "background" that is the whole picture is not one', () => expect(findBackground(labOfPic(picture(W, 0x55aa55)), W)).toBe(null));
});

describe('thingBox, squareAround and isRound', () => {
  const ball = maskOf(W, (x, y) => (x + 0.5 - 16) ** 2 + (y + 0.5 - 16) ** 2 <= 64);
  it('the box around the thing', () => expect(thingBox(ball, W)).toEqual({ x0: 8, y0: 8, x1: 24, y1: 24 }));
  it('no thing', () => expect(thingBox(new Uint8Array(W * W).fill(1), W)).toBe(null));
  it('stray specks at the edge are left out', () => {
    const m = maskOf(100, (x, y) => (x >= 40 && x < 60 && y >= 40 && y < 60) || (x === 0 && y === 0));
    expect(thingBox(m, 100)).toEqual({ x0: 40, y0: 40, x1: 60, y1: 60 });
  });
  it('a thing touching the edges', () => expect(thingBox(new Uint8Array(16), 4)).toEqual({ x0: 0, y0: 0, x1: 4, y1: 4 }));
  it('a square with room for one block each side', () => {
    expect(squareAround({ x0: 8, y0: 8, x1: 24, y1: 24 }, W, 8)).toEqual({ x: 6, y: 6, side: 21 });
    expect(squareAround(null, W, 8)).toEqual({ x: 0, y: 0, side: W });
  });
  it('kept inside the photo, at least 2 pixels a block', () => {
    expect(squareAround({ x0: 0, y0: 0, x1: 4, y1: 4 }, W, 12)).toEqual({ x: 0, y: 0, side: 24 });
    expect(squareAround({ x0: 0, y0: 0, x1: W, y1: W }, W, 8)).toEqual({ x: 0, y: 0, side: W });
    expect(squareAround({ x0: 10, y0: 10, x1: 10, y1: 10 }, W, 2)).toEqual({ x: 8, y: 8, side: 4 });
  });
  it('round things', () => {
    expect(isRound(ball, W, thingBox(ball, W))).toBe(true);
    const square = maskOf(W, (x, y) => x >= 8 && x < 24 && y >= 8 && y < 24);
    expect(isRound(square, W, thingBox(square, W))).toBe(false);
  });
  it('too small or no box is not round', () => {
    const dot = maskOf(W, (x, y) => x >= 5 && x < 8 && y >= 5 && y < 8);
    expect(isRound(dot, W, thingBox(dot, W))).toBe(false);
    expect(isRound(ball, W, null)).toBe(false);
  });
});

describe('sizes', () => {
  it('the sizes', () => expect(SIZES).toEqual([8, 12, 16, 24, 32]));
  it('edge distance: half the width at the middle', () => {
    const labels = Uint8Array.from({ length: 49 }, (_, p) => (p % 7 >= 1 && p % 7 <= 5 && p >= 7 && p < 42 ? 1 : 0));
    const d = edgeDistance(labels, 7);
    expect(d[3 * 7 + 3]).toBe(9);
    expect(d[3 * 7 + 1]).toBe(3);
  });
  it('a big round thing starts small; thin parts need a bigger grid', () => {
    const ball = maskOf(64, (x, y) => (x - 32) ** 2 + (y - 32) ** 2 <= 400);
    expect(shapeSize(ball, 64, thingBox(ball, 64))).toBe(8);
    const stick = maskOf(64, (x, y) => (x >= 10 && x < 54 && y >= 30 && y < 32) || (x >= 10 && x < 20 && y >= 20 && y < 40));
    expect(shapeSize(stick, 64, thingBox(stick, 64))).toBeGreaterThan(8);
  });
  it('no background starts in the middle', () => expect(shapeSize(null, 64, null)).toBe(16));
  it('so thin nothing fits: the biggest size', () => {
    const hair = maskOf(64, (x, y) => y === 32 || x === 32);
    expect(shapeSize(hair, 64, thingBox(hair, 64))).toBe(32);
  });
  it('thin share', () => {
    const ball = maskOf(64, (x, y) => (x - 32) ** 2 + (y - 32) ** 2 <= 400);
    const edges = edgeDistance(ball, 64);
    expect(thinShare(ball, 64, edges, 1, { x: 0, y: 0, side: 64 })).toBeLessThan(0.05);
    expect(thinShare(ball, 64, edges, 30, { x: 0, y: 0, side: 64 })).toBe(1);
    expect(thinShare(new Uint8Array(16).fill(1), 4, new Float32Array(16), 1, { x: 0, y: 0, side: 4 })).toBe(0);
  });
  it('part widths leave out the background and specks', () => {
    const labels = new Int16Array(64 * 64).fill(0);
    for (let y = 10; y < 50; y++) for (let x = 10; x < 50; x++) labels[y * 64 + x] = 1;
    labels[0] = 2;
    const widths = partWidths(labels, 64, 0);
    expect(widths).toHaveLength(1);
    expect(widths[0]).toBeGreaterThan(30);
  });
  it('parts size: big parts start small, small eyes need more', () => {
    const labels = new Int16Array(64 * 64).fill(0);
    for (let y = 8; y < 56; y++) for (let x = 8; x < 56; x++) labels[y * 64 + x] = 1;
    const box = { x0: 8, y0: 8, x1: 56, y1: 56 };
    expect(partsSize(labels, 64, box, 0)).toBe(8);
    for (const [ex, ey] of [[20, 20], [40, 20], [30, 40]]) for (let y = ey; y < ey + 6; y++) for (let x = ex; x < ex + 6; x++) labels[y * 64 + x] = 2;
    expect(partsSize(labels, 64, box, 0)).toBeGreaterThan(8);
  });
  it('parts too thin for any size: the biggest', () => {
    const labels = Int16Array.from({ length: 64 * 64 }, (_, p) => (p % 2 ? 1 : 2));
    expect(partsSize(labels, 64, null, -1)).toBe(32);
  });
  it('the starting size is the bigger of the two', () => {
    const ball = maskOf(64, (x, y) => (x - 32) ** 2 + (y - 32) ** 2 <= 400);
    const labels = Int16Array.from(ball, (m) => (m ? 0 : 1));
    expect(startingSize(ball, labels, 64, thingBox(ball, 64), 0)).toBe(8);
    expect(startingSize(null, labels, 64, null)).toBe(16);
  });
});

describe('grid', () => {
  it('the most common group in each square, ties to the lower number', () => {
    const labels = Int16Array.from([0, 1, 1, 1, 2, 2, 2, 2, 3, 3, 0, 0, 3, 3, 0, 0]);
    expect(Array.from(cellModes(labels, 4, 2))).toEqual([2, 1, 3, 0]);
    expect(Array.from(cellModes(Int16Array.from([1, 0, 0, 1]), 2, 1))).toEqual([0]);
  });
  it('a part of the photo, and a grid finer than the photo', () => {
    const labels = Int16Array.from([0, 0, 0, 0, 0, 5, 5, 0, 0, 5, 5, 0, 0, 0, 0, 0]);
    expect(Array.from(cellModes(labels, 4, 1, { x: 1, y: 1, side: 2 }))).toEqual([5]);
    expect(Array.from(cellModes(Int16Array.from([7]), 1, 3))).toEqual(Array(9).fill(7));
  });
  it('sides', () => {
    expect(sides(4, 3).sort()).toEqual([1, 3, 5, 7]);
    expect(sides(0, 3).sort()).toEqual([1, 3]);
    expect(sides(8, 3).sort()).toEqual([5, 7]);
    expect(sides(0, 1)).toEqual([]);
  });
  it('majority: a lone square takes its neighbours', () => {
    expect(Array.from(majority(Int16Array.from([0, 0, 0, 0, 1, 0, 0, 0, 0]), 3))).toEqual(Array(9).fill(0));
    expect(Array.from(majority(Int16Array.from([1, 0, 0, 0]), 2))).toEqual([0, 0, 0, 0]);
  });
  it('majority keeps a square with mixed neighbours', () => {
    const cells = Int16Array.from([0, 1, 0, 2, 3, 2, 0, 1, 0]);
    expect(majority(cells, 3)[4]).toBe(3);
  });
  it('patches', () => {
    expect(patches(Int16Array.from([0, 0, 1, 1]), 2)).toEqual([{ group: 0, squares: [0, 1] }, { group: 1, squares: [2, 3] }]);
    expect(patches(Int16Array.from([0, 1, 1, 0]), 2)).toHaveLength(4);
    expect(patches(Int16Array.from([0, 1, 0, 1]), 2)).toHaveLength(2);
    expect(patches(new Int16Array(0), 0)).toEqual([]);
  });
  it('islands under 3 squares take what they touch most', () => {
    const cells = Int16Array.from([0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(Array.from(removeIslands(cells, 4))).toEqual(Array(16).fill(0));
    expect(Array.from(removeIslands(cells, 4, 2))).toEqual(Array.from(cells));
  });
  it('an island takes the group it touches most, not the first it finds', () => {
    // The 1 at the middle touches a 2 above it and 0s on its other three sides.
    const cells = Int16Array.from([0, 2, 0, 0, 1, 0, 0, 0, 0]);
    expect(removeIslands(cells, 3)[4]).toBe(0);
    // Here the 0s are found first and still win over the column of 2s.
    expect(Array.from(removeIslands(Int16Array.from([2, 0, 0, 2, 1, 0, 2, 0, 0]), 3))).toEqual([2, 0, 0, 2, 0, 0, 2, 0, 0]);
  });
  it('a thing in the last row or column only', () => {
    expect(thingBox(maskOf(4, (x, y) => x === 3 && y === 3), 4)).toEqual({ x0: 3, y0: 3, x1: 4, y1: 4 });
    expect(thingBox(maskOf(4, (x, y) => x === 0 && y === 0), 4)).toEqual({ x0: 0, y0: 0, x1: 1, y1: 1 });
    expect(thingBox(maskOf(1, () => true), 1)).toEqual({ x0: 0, y0: 0, x1: 1, y1: 1 });
  });
  it('an island touching nothing else stays', () => expect(Array.from(removeIslands(Int16Array.from([4]), 1))).toEqual([4]));
  it('clean up', () => {
    const cells = new Int16Array(25).fill(0);
    for (const i of [6, 7, 8, 11, 12, 13, 16, 17, 18]) cells[i] = 1;
    cells[0] = 2;
    const out = cleanUp(cells, 5);
    expect(out[0]).toBe(0);
    expect(out[12]).toBe(1);
  });
  it('the outline goes round the thing, corners too', () => {
    const cells = new Int16Array(25).fill(0);
    cells[12] = 1;
    expect(outlineSquares(cells, 5, 0)).toEqual([6, 7, 8, 11, 13, 16, 17, 18]);
    expect(outlineSquares(new Int16Array(4), 2, 0)).toEqual([]);
    expect(outlineSquares(new Int16Array(4).fill(1), 2, 0)).toEqual([]);
  });
});

describe('pixel rows', () => {
  const book = { items: { white_wool: { name: 'White Wool' } } };
  const art = { size: 3, blocks: ['white_wool', 'orange_wool'], cells: [0, 0, 0, 0, 1, 0, 1, 1, 0] };
  it('row 1 is the bottom row', () => {
    expect(rowCells(art, 1)).toEqual([1, 1, 0]);
    expect(rowCells(art, 3)).toEqual([0, 0, 0]);
  });
  it('runs left to right', () => expect(rowRuns(art, 1)).toEqual([{ id: 'orange_wool', count: 2 }, { id: 'white_wool', count: 1 }]));
  it('counts, most first, then by name', () => {
    expect(blockCounts(art)).toEqual([{ id: 'white_wool', count: 6 }, { id: 'orange_wool', count: 3 }]);
    expect(blockCounts({ blocks: ['b', 'a'], cells: [0, 1] })).toEqual([{ id: 'a', count: 1 }, { id: 'b', count: 1 }]);
    expect(blockCounts({ blocks: [], cells: [] })).toEqual([]);
  });
  it('sentences', () => {
    expect(rowSentence(book, art, 1)).toBe('Start at the bottom, on the left. Row 1: 2 orange wool and 1 white wool.');
    expect(rowSentence(book, art, 2)).toBe('Row 2: 1 white wool, 1 orange wool and 1 white wool.');
    expect(countText(book, { id: 'white_wool', count: 37 })).toBe('37 white wool');
  });
  it('the real pixel pictures', () => {
    const { builds, book: real } = realData();
    for (const p of builds.pixel) {
      expect(p.cells).toHaveLength(p.size * p.size);
      expect(rowSentence(real, p, 1)).toMatch(/^Start at the bottom/);
    }
  });
});
