import './_setup.mjs';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  DIFFICULTIES, MOST, sizeOf, blockAt, allBlocks, buildCounts, layerCounts, totalOf, countWords, pictureId, coverSentence, layerSentence, sizeText,
  filterBuilds, findBuild,
} from '../../logic/builds.js';
import { floating, checkBuild } from '../../logic/build-check.js';
import { WOODS, isWooden, isPlain, woodSwap, shapeOf, shaped, paletteSwaps, isRemixed, remixName, remixBuild, remixIds } from '../../logic/remix.js';
import { remixOf, setRemix, remixedBuild } from '../../data/remixes.js';
import { paletteById } from '../../data/palettes.js';
import { realData } from './_setup.mjs';

const book = { items: { oak_planks: { name: 'Oak Planks' }, bricks: { name: 'Bricks' }, oak_log: { name: 'Oak Log' }, glass: { name: 'Glass' } } };

// A 3 by 2 hut, 2 layers: planks floor with a bed, then walls of logs and glass with a gap.
const hut = {
  id: 'hut', name: 'Hut', about: 'A tiny hut.', difficulty: 'Easy', group: 'Builds',
  key: { p: 'oak_planks', b: { id: 'red_bed', facing: 'east', part: 'foot' }, B: { id: 'red_bed', facing: 'east', part: 'head' }, l: 'oak_log', g: 'glass', w: 'water', G: { id: 'grass_block', ground: true } },
  layers: [
    { name: 'Floor', tip: 'Dig down one.', rows: ['ppp', 'bBG'] },
    { name: 'Walls', rows: ['l.g', 'l..'] },
  ],
};

describe('sizeOf', () => {
  it('width, height and depth', () => expect(sizeOf(hut)).toEqual({ W: 3, H: 2, D: 2 }));
  it('no layers', () => expect(sizeOf({ layers: [] })).toEqual({ W: 0, H: 0, D: 0 }));
  it('a layer with no rows', () => expect(sizeOf({ layers: [{ rows: [] }] })).toEqual({ W: 0, H: 1, D: 0 }));
  it('difficulty limits', () => {
    expect(DIFFICULTIES).toEqual(['Easy', 'Medium', 'Big']);
    expect(MOST).toEqual({ Easy: 7, Medium: 11, Big: 15 });
  });
});

describe('blockAt', () => {
  it('a plain block and a block that points a way', () => {
    expect(blockAt(hut, 0, 0, 0)).toEqual({ id: 'oak_planks' });
    expect(blockAt(hut, 1, 0, 1)).toEqual({ id: 'red_bed', facing: 'east', part: 'head' });
  });
  it('air, outside, and letters not in the key', () => {
    expect(blockAt(hut, 1, 1, 0)).toBe(null);
    expect(blockAt(hut, 5, 0, 0)).toBe(null);
    expect(blockAt(hut, 0, 9, 0)).toBe(null);
    expect(blockAt(hut, 0, 0, 9)).toBe(null);
    expect(blockAt({ key: {}, layers: [{ rows: ['z'] }] }, 0, 0, 0)).toBe(null);
  });
});

describe('allBlocks', () => {
  it('every block with where it is', () => {
    const all = allBlocks(hut);
    expect(all).toHaveLength(9);
    expect(all[0]).toEqual([0, 0, 0, { id: 'oak_planks' }]);
    expect(all[all.length - 1]).toEqual([0, 1, 1, { id: 'oak_log' }]);
  });
  it('empty build', () => expect(allBlocks({ key: {}, layers: [] })).toEqual([]));
});

describe('counts', () => {
  it('most first; a bed counts once and ground not at all', () => {
    expect(buildCounts(hut)).toEqual([{ id: 'oak_planks', count: 3 }, { id: 'oak_log', count: 2 }, { id: 'glass', count: 1 }, { id: 'red_bed', count: 1 }]);
  });
  it('one layer', () => expect(layerCounts(hut, 2)).toEqual([{ id: 'oak_log', count: 2 }, { id: 'glass', count: 1 }]));
  it('a layer that is not there', () => expect(layerCounts(hut, 5)).toEqual([]));
  it('totals', () => {
    expect(totalOf(buildCounts(hut))).toBe(7);
    expect(totalOf([])).toBe(0);
  });
});

describe('countWords and pictureId', () => {
  it('water', () => {
    expect(countWords(book, { id: 'water', count: 1 })).toBe('1 square of water');
    expect(countWords(book, { id: 'water', count: 8 })).toBe('8 squares of water');
  });
  it('one bricks is a block', () => {
    expect(countWords(book, { id: 'bricks', count: 1 })).toBe('1 bricks block');
    expect(countWords(book, { id: 'bricks', count: 4 })).toBe('4 bricks');
  });
  it('names from the book, or from the id', () => {
    expect(countWords(book, { id: 'oak_planks', count: 42 })).toBe('42 oak planks');
    expect(countWords(book, { id: 'oak_log', count: 1 })).toBe('1 oak log');
    expect(countWords(book, { id: 'red_bed', count: 2 })).toBe('2 red beds');
  });
  it('pictures', () => {
    expect(pictureId('water')).toBe('water_bucket');
    expect(pictureId('glass')).toBe('glass');
  });
});

describe('sentences', () => {
  it('the cover', () => expect(coverSentence(book, hut)).toBe('Hut. A tiny hut. It has 2 layers, and needs 3 oak planks, 2 oak logs and 2 more kinds of block.'));
  it('a cover with one more kind, one layer', () => {
    const b = { ...hut, layers: [{ name: 'x', rows: ['ppl', 'g..'] }] };
    expect(coverSentence(book, b)).toBe('Hut. A tiny hut. It has 1 layer, and needs 2 oak planks, 1 glass and 1 more kind of block.');
  });
  it('a cover with two kinds or fewer', () => {
    const b = { ...hut, layers: [{ name: 'x', rows: ['p..', '...'] }] };
    expect(coverSentence(book, b)).toBe('Hut. A tiny hut. It has 1 layer, and needs 1 oak plank.');
  });
  it('the first layer says where to start and gives the tip', () => {
    expect(layerSentence(book, hut, 1)).toBe('Start at the bottom. Layer 1 of 2: floor. Dig down one. You need 3 oak planks and 1 red bed.');
  });
  it('a later layer', () => expect(layerSentence(book, hut, 2)).toBe('Layer 2 of 2: walls. You need 2 oak logs and 1 glass.'));
  it('size text', () => {
    expect(sizeText(hut)).toBe('2 layers · 3 by 2 blocks · 7 blocks');
    expect(sizeText({ key: { p: 'oak_planks' }, layers: [{ rows: ['p'] }] })).toBe('1 layer · 1 by 1 blocks · 1 block');
  });
});

describe('filterBuilds and findBuild', () => {
  const list = [{ id: 'a', difficulty: 'Easy' }, { id: 'b', difficulty: 'Big' }];
  it('by difficulty, or all', () => {
    expect(filterBuilds(list, 'Big')).toEqual([list[1]]);
    expect(filterBuilds(list, 'All')).toBe(list);
    expect(filterBuilds(list, 'Medium')).toEqual([]);
  });
  it('by id', () => {
    expect(findBuild(list, 'b')).toBe(list[1]);
    expect(findBuild(list, 'z')).toBe(null);
    expect(findBuild([], 'a')).toBe(null);
  });
});

describe('floating', () => {
  it('nothing floats in the hut', () => expect(floating(hut)).toEqual([]));
  it('a block with nothing under or beside it', () => {
    const b = { key: { s: 'stone' }, layers: [{ rows: ['s..'] }, { rows: ['...'] }, { rows: ['..s'] }] };
    expect(floating(b)).toEqual(['layer 3, row 1, block 3']);
  });
  it('a block held from the side or hanging from above is fine', () => {
    const b = { key: { s: 'stone' }, layers: [{ rows: ['s.'] }, { rows: ['ss'] }, { rows: ['s.'] }] };
    expect(floating(b)).toEqual([]);
    const hang = { key: { s: 'stone' }, layers: [{ rows: ['s.'] }, { rows: ['s.'] }, { rows: ['ss'] }, { rows: ['.'] }] };
    expect(floating(hang)).toEqual([]);
  });
  it('water holds nothing up', () => {
    const b = { key: { w: 'water', s: 'stone' }, layers: [{ rows: ['w'] }, { rows: ['s'] }] };
    expect(floating(b)).toEqual(['layer 2, row 1, block 1']);
  });
  it('an empty build', () => expect(floating({ key: {}, layers: [] })).toEqual([]));
});

describe('checkBuild', () => {
  it('a good build has no problems', () => expect(checkBuild(hut)).toEqual([]));
  it('needs a name, an about line and a difficulty', () => {
    expect(checkBuild({ ...hut, name: '', difficulty: 'Huge' })).toEqual(['needs a name and an about line', 'difficulty must be one of Easy, Medium, Big']);
    expect(checkBuild({ ...hut, about: '' })).toEqual(['needs a name and an about line']);
  });
  it('too big for its difficulty, wide or deep', () => {
    const row = 'p'.repeat(8);
    expect(checkBuild({ ...hut, key: { p: 'oak_planks' }, layers: [{ name: 'a', rows: [row] }] })).toEqual(['8 by 1 is too big for Easy']);
    const deep = { ...hut, key: { p: 'oak_planks' }, layers: [{ name: 'a', rows: Array(8).fill('p') }] };
    expect(checkBuild(deep)).toEqual(['1 by 8 is too big for Easy']);
    expect(checkBuild({ ...deep, difficulty: 'Medium' })).toEqual([]);
  });
  it('layers of the wrong size, with no name, or with unknown letters', () => {
    const b = { ...hut, layers: [hut.layers[0], { rows: ['l.x', 'l.'] }, { name: 'c', rows: ['lll'] }] };
    expect(checkBuild(b)).toEqual(['layer 2 needs a name', "layer 2 isn't 3 by 2", 'layer 2 uses "x", which isn\'t in the key', "layer 3 isn't 3 by 2"]);
  });
  it('blocks the app does not know', () => {
    expect(checkBuild(hut, (id) => id !== 'glass' && id !== 'red_bed')).toEqual(['"b" is red_bed, which the app doesn\'t know', '"B" is red_bed, which the app doesn\'t know', '"g" is glass, which the app doesn\'t know']);
  });
  it('floating blocks, three at most, only when nothing else is wrong', () => {
    const b = { ...hut, key: { s: 'stone' }, layers: [{ name: 'a', rows: ['s....'] }, { name: 'b', rows: ['.....'] }, { name: 'c', rows: ['..sss'] }, { name: 'd', rows: ['.....'] }] };
    expect(checkBuild(b)).toEqual(['floating block at layer 3, row 1, block 3', 'floating block at layer 3, row 1, block 4', 'floating block at layer 3, row 1, block 5']);
    expect(checkBuild({ ...b, name: '' })).toEqual(['needs a name and an about line']);
  });
  it('every real build passes', () => {
    const { builds } = realData();
    for (const b of builds.builds) expect(checkBuild(b, (id) => !!builds.blocks[id] || id === 'water'), b.id).toEqual([]);
  });
});

describe('remix helpers', () => {
  it('seven woods', () => expect(WOODS.map((w) => w.id)).toEqual(['oak', 'spruce', 'birch', 'cherry', 'dark_oak', 'acacia', 'jungle']));
  it('wooden blocks', () => {
    expect(isWooden('spruce_stairs')).toBe(true);
    expect(isWooden('pale_oak_fence_gate')).toBe(true);
    expect(isWooden('oak_leaves')).toBe(false);
    expect(isWooden('stone_stairs')).toBe(false);
  });
  it('plain blocks', () => {
    expect(isPlain('cobblestone')).toBe(true);
    expect(isPlain('white_wool')).toBe(true);
    expect(isPlain('stone_bricks')).toBe(true);
    expect(isPlain('oak_stairs')).toBe(false);
    expect(isPlain('glass')).toBe(false);
  });
  it('wood swaps', () => {
    expect(woodSwap('spruce_stairs', 'birch')).toBe('birch_stairs');
    expect(woodSwap('oak_log', 'cherry', (id) => id !== 'cherry_log')).toBe('oak_log');
    expect(woodSwap('stone', 'birch')).toBe('stone');
  });
  it('shapes', () => {
    expect(shapeOf('oak_stairs')).toEqual(['oak_planks', '_stairs']);
    expect(shapeOf('stone_brick_stairs', (id) => id === 'stone_bricks')).toEqual(['stone_bricks', '_stairs']);
    expect(shapeOf('cobblestone_slab', (id) => id === 'cobblestone')).toEqual(['cobblestone', '_slab']);
    expect(shapeOf('quartz_slab', (id) => id === 'quartz_block')).toEqual(['quartz_block', '_slab']);
    expect(shapeOf('oak_fence_gate')).toEqual(['oak_planks', '_fence_gate']);
    expect(shapeOf('stone_stairs', () => false)).toBe(null);
    expect(shapeOf('glass')).toBe(null);
  });
  it('shaped blocks from plain ones', () => {
    expect(shaped('cobblestone', '_stairs')).toBe('cobblestone_stairs');
    expect(shaped('stone_bricks', '_stairs', (id) => id === 'stone_brick_stairs')).toBe('stone_brick_stairs');
    expect(shaped('spruce_planks', '_slab')).toBe('spruce_slab');
    expect(shaped('quartz_block', '_slab')).toBe('quartz_slab');
    expect(shaped('pink_wool', '_stairs', () => false)).toBe(null);
  });
});

describe('paletteSwaps', () => {
  it('the most used plain blocks get the palette in order, and go round again', () => {
    const b = { key: { p: 'oak_planks', s: 'oak_stairs', c: 'cobblestone', w: 'white_wool', g: 'glass' }, layers: [{ rows: ['ppppcc', 'sswg..'] }] };
    expect(paletteSwaps(b, { blocks: ['stone_bricks', 'glass', 'bricks'] })).toEqual({ oak_planks: 'stone_bricks', cobblestone: 'bricks', white_wool: 'stone_bricks' });
  });
  it('only blocks the app has', () => {
    const b = { key: { p: 'oak_planks' }, layers: [{ rows: ['p'] }] };
    expect(paletteSwaps(b, paletteById('candy'), (id) => id === 'white_wool')).toEqual({ oak_planks: 'white_wool' });
  });
  it('no plain blocks in the palette, or none in the build', () => {
    expect(paletteSwaps(hut, { blocks: ['glass', 'lantern'] })).toEqual({});
    expect(paletteSwaps({ key: { g: 'glass' }, layers: [{ rows: ['g'] }] }, paletteById('castle'))).toEqual({});
  });
  it('a shaped block whose base is not plain', () => {
    const b = { key: { s: 'glass_slab' }, layers: [{ rows: ['s'] }] };
    expect(paletteSwaps(b, paletteById('castle'), (id) => id === 'glass' || id === 'stone_bricks')).toEqual({});
  });
});

describe('isRemixed and remixName', () => {
  it('changes or not', () => {
    expect(isRemixed(null)).toBe(false);
    expect(isRemixed({})).toBe(false);
    expect(isRemixed({ wood: '', palette: null, flip: false })).toBe(false);
    expect(isRemixed({ flip: true })).toBe(true);
    expect(isRemixed({ wood: 'birch' })).toBe(true);
    expect(isRemixed({ palette: 'candy' })).toBe(true);
  });
  it('names', () => {
    expect(remixName({ wood: 'dark_oak', flip: true })).toBe('dark oak, flipped');
    expect(remixName({ palette: 'cozy-cabin' })).toBe('cozy cabin');
    expect(remixName({ flip: true })).toBe('flipped');
    expect(remixName({ wood: 'nope' })).toBe('');
    expect(remixName(null)).toBe('');
  });
});

describe('remixBuild', () => {
  it('no remix gives the same build', () => {
    expect(remixBuild(hut, null)).toBe(hut);
    expect(remixBuild(hut, {})).toBe(hut);
  });
  it('another wood', () => {
    const r = remixBuild(hut, { wood: 'spruce' });
    expect(r.key.p).toBe('spruce_planks');
    expect(r.key.l).toBe('spruce_log');
    expect(r.key.g).toBe('glass');
    expect(r.key.b).toEqual({ id: 'red_bed', facing: 'east', part: 'foot' });
    expect(r.layers).toBe(hut.layers);
    expect(r.variant).toBe('spruce');
    expect(r.id).toBe('hut');
  });
  it('ground stays as it is', () => expect(remixBuild(hut, { wood: 'spruce' }).key.G).toEqual({ id: 'grass_block', ground: true }));
  it('flipped left to right, and east and west swap', () => {
    const r = remixBuild(hut, { flip: true });
    expect(r.layers[0].rows).toEqual(['ppp', 'GBb']);
    expect(r.layers[1].rows).toEqual(['g.l', '..l']);
    expect(r.layers[0].name).toBe('Floor');
    expect(r.key.b.facing).toBe('west');
    expect(remixBuild({ ...hut, key: { ...hut.key, n: { id: 'oak_stairs', facing: 'north' } } }, { flip: true }).key.n).toEqual({ id: 'oak_stairs', facing: 'north' });
    expect(r.variant).toBe('flipped');
  });
  it('a palette, with stairs following their block', () => {
    const b = { ...hut, key: { p: 'oak_planks', s: { id: 'oak_stairs', facing: 'west' }, c: 'cobblestone', h: 'stone_brick_stairs' }, layers: [{ name: 'a', rows: ['pppc', 'ss.h'] }] };
    const real = new Set(['oak_planks', 'oak_stairs', 'cobblestone', 'cobblestone_stairs', 'stone_bricks', 'stone_brick_stairs', 'mossy_stone_bricks', 'cracked_stone_bricks']);
    const r = remixBuild(b, { palette: 'castle' }, (id) => real.has(id));
    expect(r.key.p).toBe('stone_bricks');
    expect(r.key.s).toEqual({ id: 'stone_brick_stairs', facing: 'west' });
    expect(r.key.c).toBe('cobblestone');
    expect(r.key.h).toBe('stone_brick_stairs');
    expect(r.variant).toBe('castle');
  });
  it('a shaped block with no shaped version in the new block stays', () => {
    const b = { ...hut, key: { p: 'oak_planks', s: 'oak_stairs' }, layers: [{ name: 'a', rows: ['pps'] }] };
    expect(remixBuild(b, { palette: 'candy' }, (id) => !id.endsWith('_stairs') || id === 'oak_stairs').key.s).toBe('oak_stairs');
  });
  it('an unknown palette changes no blocks', () => expect(remixBuild(hut, { palette: 'nope' }).key.p).toBe('oak_planks'));
});

describe('remixIds', () => {
  it('every wood block and palette block, once each', () => {
    const ids = remixIds();
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain('jungle_fence_gate');
    expect(ids).toContain('pink_wool');
    expect(ids).toContain('stone_brick_stairs');
    expect(ids).toContain('stone_bricks_slab');
  });
});

describe('saved remixes', () => {
  beforeEach(() => localStorage.clear());
  it('none at first', () => expect(remixOf('hut')).toBe(null));
  it('saves one and goes back', () => {
    setRemix('hut', { wood: 'birch' });
    setRemix('other', { flip: true });
    expect(remixOf('hut')).toEqual({ wood: 'birch' });
    setRemix('hut', null);
    expect(remixOf('hut')).toBe(null);
    expect(remixOf('other')).toEqual({ flip: true });
  });
  it('the build with its remix, only with blocks the app has', () => {
    const ctx = { builds: { builds: [hut], blocks: { birch_planks: {}, oak_log: {} } } };
    setRemix('hut', { wood: 'birch' });
    const r = remixedBuild(ctx, 'hut');
    expect(r.key.p).toBe('birch_planks');
    expect(r.key.l).toBe('oak_log');
  });
  it('no remix gives the build itself; an unknown id gives null', () => {
    const ctx = { builds: { builds: [hut], blocks: {} } };
    expect(remixedBuild(ctx, 'hut')).toBe(hut);
    expect(remixedBuild(ctx, 'nope')).toBe(null);
  });
});
