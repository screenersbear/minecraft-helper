import './_setup.mjs';
import { describe, it, expect } from 'vitest';
import {
  WORK, WHOLE, COLOURS, lookOf, groupColours, prepare, closeUp, prepareClose, colourGroups, suggestSize, blocksFrom, convert, colourName, standOut, sameColourOnce, toBlocks,
} from '../../logic/pixel-convert.js';
import { editSquare, swapBlock } from '../../logic/pixel-edits.js';
import { choices } from '../../logic/pixel.js';
import { realData } from './_setup.mjs';
import { picture, circle, rect, rgbOf } from './_pictures.mjs';

const palette = realData().book.palette;
const ball = picture(64, 0xffffff, [circle(32, 32, 20, 0xdd2222)]);
const idsOf = (r) => r.cells.map((c) => r.blocks[c]);

describe('lookOf', () => {
  it('usual values', () => expect(lookOf()).toEqual({ colours: null, outline: false, woolOnly: false, edits: {}, swaps: {} }));
  it('kept values', () => {
    expect(lookOf({ colours: 4, outline: 1, woolOnly: 'yes', edits: { 3: 'a' }, swaps: { a: 'b' } })).toEqual({ colours: 4, outline: true, woolOnly: true, edits: { 3: 'a' }, swaps: { a: 'b' } });
    expect(lookOf({ colours: '2.4' }).colours).toBe(2);
  });
  it('bad values become usual ones', () => {
    expect(lookOf({ colours: 0 }).colours).toBe(null);
    expect(lookOf({ colours: 13 }).colours).toBe(null);
    expect(lookOf({ colours: 'lots' }).colours).toBe(null);
    expect(lookOf({ edits: 'x', swaps: null }).edits).toEqual({});
    expect(lookOf({ swaps: 5 }).swaps).toEqual({});
    expect(COLOURS).toEqual({ fewest: 1, most: 12 });
  });
});

describe('groupColours', () => {
  it('the lighter half of each group', () => {
    const rgb = Uint8ClampedArray.from([200, 0, 0, 100, 0, 0, 0, 0, 250, 0, 0, 250]);
    expect(groupColours(rgb, [0, 0, 1, 1], 2)).toEqual([0xc80000, 0x0000fa]);
  });
  it('a group with no pixels is black', () => expect(groupColours(Uint8ClampedArray.from([9, 9, 9]), [0], 2)).toEqual([0x090909, 0]));
});

describe('closeUp', () => {
  it('a small thing gets a close-up with room around it', () => expect(closeUp({ x0: 100, y0: 100, x1: 140, y1: 140 }, 256)).toEqual({ x: 90 / 256, y: 90 / 256, side: 60 / 256 }));
  it('kept inside the photo', () => expect(closeUp({ x0: 0, y0: 0, x1: 20, y1: 20 }, 256)).toEqual({ x: 0, y: 0, side: 30 / 256 }));
  it('a thing that fills most of the photo, or none', () => {
    expect(closeUp({ x0: 10, y0: 10, x1: 200, y1: 200 }, 256)).toBe(null);
    expect(closeUp(null, 256)).toBe(null);
  });
});

describe('prepare and colour groups', () => {
  const prep = prepare(ball, 64);
  it('finds the background, the box and the shape', () => {
    expect(prep.width).toBe(64);
    expect(prep.mask[0]).toBe(1);
    expect(prep.box.x0).toBeGreaterThanOrEqual(10);
    expect(prep.box.x1).toBeLessThanOrEqual(54);
    expect(prep.round).toBe(true);
    expect(prep.thing.length).toBeGreaterThan(1000);
  });
  it('colour groups put the background last', () => {
    const g = colourGroups(prep);
    expect(g.background).toBe(g.colours);
    expect(g.groups).toBe(g.colours + 1);
    expect(g.labels[0]).toBe(g.background);
    expect(g.colours).toBe(1);
    expect(colourGroups(prep, 3).colours).toBeGreaterThanOrEqual(1);
  });
  it('a photo with no background', () => {
    const p = prepare(picture(16, 0x3366cc), 16);
    expect(p.mask).toBe(null);
    expect(p.box).toBe(null);
    expect(p.round).toBe(false);
    expect(p.thing).toHaveLength(256);
    const g = colourGroups(p);
    expect(g.background).toBe(-1);
    expect(g.groups).toBe(g.colours);
  });
  it('an empty photo has no pieces', () => {
    const p = prepare(new Uint8ClampedArray(0), 0);
    expect(p.thing).toEqual([]);
    expect(p.pieces).toEqual([]);
    expect(p.centres).toEqual([]);
    expect(p.box).toBe(null);
  });
  it('suggested size', () => {
    expect(suggestSize(prep)).toEqual({ size: 8, round: true });
    expect(suggestSize(prepare(picture(16, 0x3366cc), 16)).size).toBe(16);
  });
});

describe('blocksFrom and convert', () => {
  it('a red ball on white: red in the middle, white around', () => {
    const r = convert(ball, 64, 8, palette);
    const ids = idsOf(r);
    expect(ids).toHaveLength(64);
    expect(ids[4 * 8 + 4]).toMatch(/^red_/);
    expect(ids[0]).toMatch(/^white_/);
    expect(r.background).toBe(true);
    expect(r).toMatchObject({ colours: 1, autoColours: 1 });
    expect(r.mostColours).toBeGreaterThanOrEqual(1);
  });
  it('wool only, an outline, swaps and edits', () => {
    const r = convert(ball, 64, 8, palette, { woolOnly: true, outline: true, swaps: { red_wool: 'pink_wool' }, edits: { 0: 'gold_block', 999: 'x' } });
    const ids = idsOf(r);
    expect(ids.every((id) => id.endsWith('_wool') || id === 'gold_block')).toBe(true);
    expect(ids[4 * 8 + 4]).toBe('pink_wool');
    expect(ids[0]).toBe('gold_block');
    expect(ids.some((id) => id === 'black_wool' || id === 'gray_wool')).toBe(true);
  });
  it('no outline without a background', () => {
    const flat = picture(16, 0x3366cc);
    const r = convert(flat, 16, 8, palette, { outline: true });
    expect(r.background).toBe(false);
    expect(new Set(idsOf(r)).size).toBe(1);
  });
  it('the same blocks from prepare once and blocksFrom', () => {
    const prep = prepare(ball, 64);
    expect(blocksFrom(prep, 12, palette)).toEqual(convert(ball, 64, 12, palette));
  });
  it('a pale thing on a white table does not vanish', () => {
    const r = convert(picture(64, 0xffffff, [circle(32, 32, 20, 0xeeeeee), circle(32, 32, 6, 0xcc9966)]), 64, 8, palette);
    expect(new Set(idsOf(r)).size).toBeGreaterThan(1);
  });
});

describe('prepareClose', () => {
  it('looks again close up at a small thing', async () => {
    const parts = [];
    const read = (part) => {
      parts.push(part);
      return part === WHOLE ? picture(WORK, 0xffffff, [circle(128, 128, 20, 0x2244cc)]) : picture(WORK, 0xffffff, [circle(128, 128, 80, 0x2244cc)]);
    };
    const prep = await prepareClose(read);
    expect(parts).toHaveLength(2);
    expect(prep.part).toBe(parts[1]);
    expect(prep.part.side).toBeLessThan(0.5);
  });
  it('a thing that fills the photo is looked at once', async () => {
    const prep = await prepareClose(async () => picture(WORK, 0xffffff, [circle(128, 128, 110, 0x2244cc)]));
    expect(prep.part).toBe(WHOLE);
  });
  it('the whole photo is kept when the close-up finds no thing', async () => {
    let n = 0;
    const prep = await prepareClose((part) => (n++ === 0 ? picture(WORK, 0xffffff, [circle(128, 128, 20, 0x2244cc)]) : picture(WORK, 0x2244cc)));
    expect(prep.part).toBe(WHOLE);
  });
});

describe('colour names, standing out, one block per colour', () => {
  const list = choices(palette);
  it('colour names', () => {
    expect(colourName('orange_wool')).toBe('orange');
    expect(colourName('light_blue_concrete')).toBe('light_blue');
    expect(colourName('red_terracotta')).toBe('red');
    expect(colourName('gold_block')).toBe('gold_block');
  });
  it('the thing never takes the background colour', () => {
    const out = standOut(['white_wool', 'white_concrete', 'red_wool'], [0xffffff, 0xeeeeee, 0xff0000], 0, list);
    expect(out[0]).toBe('white_wool');
    expect(out[1]).not.toMatch(/^white_/);
    expect(out[2]).toBe('red_wool');
  });
  it('no background, or nothing else to pick', () => {
    expect(standOut(['white_wool'], [0xffffff], -1, list)).toEqual(['white_wool']);
    expect(standOut(['white_wool', 'white_wool'], [0xffffff, 0xffffff], 0, [{ id: 'white_wool', ok: [100, 0, 0] }])).toEqual(['white_wool', 'white_wool']);
  });
  it('groups of one colour take the block with the most squares', () => {
    expect(sameColourOnce(['orange_wool', 'orange_concrete', 'red_wool'], [0, 1, 1, 1, 2])).toEqual(['orange_concrete', 'orange_concrete', 'red_wool']);
    expect(sameColourOnce(['orange_wool', 'orange_concrete'], [0, 0, 1])).toEqual(['orange_wool', 'orange_wool']);
  });
  it('the background keeps its own block', () => {
    expect(sameColourOnce(['white_wool', 'white_concrete'], [0, 0, 0, 1], 0)).toEqual(['white_wool', 'white_concrete']);
  });
  it('toBlocks', () => {
    expect(toBlocks(['a', 'b', 'a', 'c'])).toEqual({ blocks: ['a', 'b', 'c'], cells: [0, 1, 0, 2] });
    expect(toBlocks([])).toEqual({ blocks: [], cells: [] });
  });
});

describe('pixel edits', () => {
  const art = { blocks: ['white_wool', 'red_wool'], cells: [0, 1, 1, 0], edits: { 0: 'white_wool' }, swaps: { blue_wool: 'red_wool' } };
  it('one square to another block', () => {
    expect(editSquare(art, 1, 'gold_block')).toEqual({ blocks: ['white_wool', 'gold_block', 'red_wool'], cells: [0, 1, 2, 0], edits: { 0: 'white_wool', 1: 'gold_block' } });
  });
  it('a square outside the picture changes nothing', () => {
    expect(editSquare(art, -1, 'x')).toEqual({});
    expect(editSquare(art, 4, 'x')).toEqual({});
  });
  it('works with no edits saved yet', () => expect(editSquare({ blocks: ['a'], cells: [0] }, 0, 'b').edits).toEqual({ 0: 'b' }));
  it('a block swapped everywhere, with earlier swaps and edits following', () => {
    expect(swapBlock(art, 'red_wool', 'pink_wool')).toEqual({
      blocks: ['white_wool', 'pink_wool'], cells: [0, 1, 1, 0], swaps: { blue_wool: 'pink_wool', red_wool: 'pink_wool' }, edits: { 0: 'white_wool' },
    });
    expect(swapBlock(art, 'white_wool', 'black_wool').edits).toEqual({ 0: 'black_wool' });
  });
  it('swapping back drops the old swap; every pink, old or new, now becomes red', () => {
    const a = { blocks: ['pink_wool'], cells: [0], swaps: { red_wool: 'pink_wool' } };
    expect(swapBlock(a, 'pink_wool', 'red_wool').swaps).toEqual({ pink_wool: 'red_wool' });
  });
  it('swapping a block for itself saves no swap', () => expect(swapBlock({ blocks: ['a'], cells: [0] }, 'a', 'a')).toEqual({ blocks: ['a'], cells: [0], swaps: {}, edits: {} }));
});
