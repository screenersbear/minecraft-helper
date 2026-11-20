import './_setup.mjs';
import { describe, it, expect } from 'vitest';
import { entryOf, lookId, stepOfLetters, stepBuild, newBlocks, checkTrick } from '../../logic/tricks.js';
import { realData } from './_setup.mjs';

// A path: grass first, then the path where grass was, then a door with its own look, then a step that adds nothing.
const trick = {
  id: 'path', name: 'Garden path',
  key: { g: { id: 'grass_block', ground: true }, p: { id: 'dirt_path', was: 'g' }, d: { id: 'oak_door', look: 'oak_door_top' }, s: 'stone' },
  layers: [{ rows: ['gpg', 'gps'] }, { rows: ['..d', '...'] }],
  steps: [{ title: 'Grass', say: 'Find grass.', add: 'g' }, { title: 'Path', say: 'Use a shovel.', add: 'ps' }, { title: 'Door', say: 'Add a door.', add: 'd' }, { title: 'Look', say: 'Done.' }],
};

describe('entryOf and lookId', () => {
  it('a plain id', () => {
    expect(entryOf('stone')).toEqual({ id: 'stone' });
    expect(lookId('stone')).toBe('stone');
  });
  it('an entry with a look', () => {
    expect(entryOf(trick.key.d)).toBe(trick.key.d);
    expect(lookId(trick.key.d)).toBe('oak_door_top');
    expect(lookId(trick.key.p)).toBe('dirt_path');
  });
});

describe('stepOfLetters', () => {
  it('which step adds each letter', () => expect(stepOfLetters(trick)).toEqual({ g: 0, p: 1, s: 1, d: 2 }));
  it('no steps', () => expect(stepOfLetters({ steps: [] })).toEqual({}));
});

describe('stepBuild', () => {
  it('the first step: only the ground, nothing marked or dim', () => {
    const b = stepBuild(trick, 0);
    expect(b.id).toBe('trick-path-0');
    expect(b.name).toBe('Garden path');
    expect(b.layers).toBe(trick.layers);
    expect(b.key).toEqual({ g: { id: 'grass_block', ground: true, mark: false, dim: false }, p: { id: 'grass_block', ground: true, mark: false, dim: false } });
  });
  it('a middle step: new blocks marked, earlier ones dim, later ones not there yet', () => {
    const { key } = stepBuild(trick, 1);
    expect(key.p).toEqual({ id: 'dirt_path', was: 'g', mark: true, dim: false });
    expect(key.s).toEqual({ id: 'stone', mark: true, dim: false });
    expect(key.g.dim).toBe(true);
    expect(key.d).toBe(undefined);
  });
  it('a block with its own look', () => expect(stepBuild(trick, 2).key.d).toEqual({ id: 'oak_door_top', look: 'oak_door_top', mark: true, dim: false }));
  it('a step that adds nothing shows everything, none of it dim', () => {
    const { key } = stepBuild(trick, 3);
    expect(Object.values(key).every((b) => !b.mark && !b.dim)).toBe(true);
    expect(Object.keys(key).sort()).toEqual(['d', 'g', 'p', 's']);
  });
  it('a first step that is all new marks nothing', () => {
    const t = { ...trick, steps: [{ add: 's' }, { add: 'g' }] };
    expect(stepBuild(t, 0).key.s).toEqual({ id: 'stone', mark: false, dim: false });
  });
  it('a loop of "was" letters stops', () => {
    const t = { id: 'x', name: 'X', layers: [], key: { a: { id: 'a', was: 'b' }, b: { id: 'b', was: 'a' } }, steps: [{ add: '' }, { add: 'a' }, { add: 'b' }] };
    expect(stepBuild(t, 0).key).toEqual({});
  });
  it('a "was" letter that is not in the key', () => {
    const t = { id: 'x', name: 'X', layers: [], key: { a: { id: 'a', was: 'z' } }, steps: [{}, { add: 'a' }] };
    expect(stepBuild(t, 0).key).toEqual({});
  });
  it('a step letter that is not in the key is skipped', () => {
    const t = { id: 'x', name: 'X', layers: [], key: { s: 'stone' }, steps: [{ add: 'z' }, { add: 's' }] };
    expect(stepBuild(t, 1).key).toEqual({ s: { id: 'stone', mark: true, dim: false } });
    expect(stepBuild({ ...t, steps: [{ add: 'z' }, { add: 's' }] }, 0).key).toEqual({});
  });
  it('a step past the end shows everything', () => expect(Object.keys(stepBuild(trick, 9).key)).toHaveLength(4));
});

describe('newBlocks', () => {
  it('the blocks a step adds, once each', () => {
    expect(newBlocks(trick, 1)).toEqual(['dirt_path', 'stone']);
    expect(newBlocks({ key: { a: 'stone', b: 'stone' }, steps: [{ add: 'ab' }] }, 0)).toEqual(['stone']);
  });
  it('nothing for a step that adds nothing, or no step', () => {
    expect(newBlocks(trick, 3)).toEqual([]);
    expect(newBlocks(trick, 10)).toEqual([]);
  });
  it('letters not in the key are left out', () => expect(newBlocks({ key: {}, steps: [{ add: 'z' }] }, 0)).toEqual([]));
});

describe('checkTrick', () => {
  it('a good trick', () => expect(checkTrick(trick)).toEqual([]));
  it('no name, too few steps, empty steps, no layers', () => {
    expect(checkTrick({ key: {}, steps: [{ title: 'a' }] })).toEqual(['it has no name', 'it has 1 steps, not 3 to 5', 'step 1 needs a title and something to say', 'it has no layers']);
    expect(checkTrick({ name: 'x', key: {}, layers: [] })).toContain('it has 0 steps, not 3 to 5');
  });
  it('too many steps', () => {
    const steps = Array.from({ length: 6 }, () => ({ title: 't', say: 's' }));
    expect(checkTrick({ ...trick, steps: [...steps.slice(0, 1).map((s) => ({ ...s, add: 'gps' })), ...steps.slice(1, 5), { ...steps[5], add: 'd' }] })).toEqual(['it has 6 steps, not 3 to 5']);
  });
  it('layers not the same size', () => {
    expect(checkTrick({ ...trick, layers: [{ rows: ['gpg', 'gps'] }, { rows: ['..d'] }] })).toEqual(['its layers are not all the same size']);
    expect(checkTrick({ ...trick, layers: [{ rows: ['gpg', 'gp'] }, { rows: ['..d', '...'] }] })).toEqual(['its layers are not all the same size']);
    expect(checkTrick({ ...trick, layers: [{ rows: ['gpg', 'gps'] }, { name: 'none' }] })).toEqual(['its layers are not all the same size']);
  });
  it('letters missing from the key, or added by no step', () => {
    const t = { ...trick, layers: [{ rows: ['gpz', 'gps'] }, { rows: ['..d', '...'] }], key: { ...trick.key, x: 'stone' } };
    expect(checkTrick(t)).toEqual(['"z" isn\'t in the key', 'no step adds "x"']);
  });
  it('a "was" letter not in the key, and no picture', () => {
    const t = { ...trick, key: { ...trick.key, p: { id: 'dirt_path', was: 'q' } } };
    expect(checkTrick(t, (id) => id !== 'stone')).toEqual(['"p" was "q", which isn\'t in the key', "there's no picture for stone"]);
  });
  it('steps that add letters not in the key, or the same letter twice', () => {
    const t = { ...trick, steps: [...trick.steps.slice(0, 3), { title: 'x', say: 'y', add: 'dq' }] };
    expect(checkTrick(t)).toEqual(['more than one step adds "d"', 'a step adds "q", which isn\'t in the key']);
  });
  it('no key at all', () => {
    expect(checkTrick({ name: 'x', steps: trick.steps, layers: [{ rows: ['.'] }] })).toEqual([
      'a step adds "g", which isn\'t in the key', 'a step adds "p", which isn\'t in the key', 'a step adds "s", which isn\'t in the key', 'a step adds "d", which isn\'t in the key',
    ]);
  });
  // Bug found 2026-11-20: a trick with no steps crashed the check instead of saying so.
  it('a trick with no steps says so instead of crashing', () => {
    expect(checkTrick({ name: 'x', key: { s: 'stone' }, layers: [{ rows: ['s'] }] })).toEqual(['it has 0 steps, not 3 to 5', 'no step adds "s"']);
  });
  it('every real trick passes', () => {
    const { tricks, builds } = realData();
    const list = Array.isArray(tricks) ? tricks : tricks.tricks;
    for (const t of list) expect(checkTrick(t, (id) => !!builds.blocks[id] || true), t.id).toEqual([]);
  });
});
