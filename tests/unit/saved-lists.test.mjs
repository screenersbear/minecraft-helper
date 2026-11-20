// The small saved lists in data/: add-on switches, ideas, last thing, my builds, pixel art, recent, photo.
import './_setup.mjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { addonsOff, setAddonOn } from '../../data/addon-switches.js';
import { listIdeas, saveIdea, removeIdea, ideaFileName } from '../../data/ideas.js';
import { rememberThing, lastThing } from '../../data/last-thing.js';
import { listMyBuilds, myBuildById, addMyBuild, removeMyBuild } from '../../data/my-builds.js';
import { listArt, getArt, saveArt, updateArt, removeArt, newArtId } from '../../data/pixel-store.js';
import { addRecent, listRecent } from '../../data/recent.js';
import { setPhoto, getPhoto } from '../../data/photo.js';

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

// Lets only `room` characters of saved text fit, like a phone that's nearly full.
function fullAt(room) {
  const real = Storage.prototype.setItem;
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (key, value) {
    if (value.length > room) throw new Error('full');
    return real.call(this, key, value);
  });
}

describe('add-on switches', () => {
  it('every add-on starts on', () => expect(addonsOff()).toEqual([]));
  it('turning one off and on again', () => {
    setAddonOn('the-bloop', false);
    setAddonOn('other', false);
    expect(addonsOff()).toEqual(['the-bloop', 'other']);
    setAddonOn('the-bloop', true);
    expect(addonsOff()).toEqual(['other']);
  });
  it('turning one off twice saves it once', () => {
    setAddonOn('x', false);
    setAddonOn('x', false);
    expect(addonsOff()).toEqual(['x']);
  });
  it('turning on one that was never off changes nothing', () => {
    setAddonOn('x', true);
    expect(addonsOff()).toEqual([]);
  });
});

describe('ideas', () => {
  it('saves newest first', () => {
    expect(saveIdea({ title: 'House', photo: 'p1' }, 1000)).toBe(true);
    expect(saveIdea({ title: 'Birdhouse', photo: 'p2' }, 2000)).toBe(true);
    expect(listIdeas().map((i) => i.title)).toEqual(['Birdhouse', 'House']);
    expect(listIdeas()[0]).toEqual({ id: (2000).toString(36), title: 'Birdhouse', photo: 'p2', made: 2000 });
  });
  it('keeps 20 at most', () => {
    for (let i = 1; i <= 22; i++) saveIdea({ title: `t${i}`, photo: 'p' }, i * 1000);
    expect(listIdeas()).toHaveLength(20);
    expect(listIdeas()[0].title).toBe('t22');
    expect(listIdeas()[19].title).toBe('t3');
  });
  it('drops the oldest when the phone is full', () => {
    saveIdea({ title: 'old', photo: 'x'.repeat(50) }, 1000);
    fullAt(120);
    expect(saveIdea({ title: 'new', photo: 'y'.repeat(50) }, 2000)).toBe(true);
    expect(listIdeas().map((i) => i.title)).toEqual(['new']);
  });
  it('says false when even one will not fit', () => {
    fullAt(10);
    expect(saveIdea({ title: 'big', photo: 'z'.repeat(50) }, 1000)).toBe(false);
    expect(listIdeas()).toEqual([]);
  });
  it('uses the time now when none is given', () => {
    saveIdea({ title: 'a', photo: 'p' });
    expect(listIdeas()[0].made).toBeGreaterThan(0);
  });
  it('removes one', () => {
    saveIdea({ title: 'a', photo: 'p' }, 1000);
    saveIdea({ title: 'b', photo: 'p' }, 2000);
    removeIdea((1000).toString(36));
    expect(listIdeas().map((i) => i.title)).toEqual(['b']);
    removeIdea('none');
    expect(listIdeas()).toHaveLength(1);
  });
  it('file names', () => {
    expect(ideaFileName('Birdhouse!')).toBe('birdhouse.jpg');
    expect(ideaFileName('  My big House 2 ')).toBe('my-big-house-2.jpg');
    expect(ideaFileName('')).toBe('idea.jpg');
    expect(ideaFileName(null)).toBe('idea.jpg');
    expect(ideaFileName('!!!')).toBe('idea.jpg');
  });
});

describe('last thing', () => {
  const cat = { type: 'mob', id: 'cat' };
  it('remembers for an hour', () => {
    rememberThing({ target: cat, kind: 'tame', mentions: [{ target: { type: 'item', id: 'cod' }, field: 'eats', extra: 1 }, { target: cat }] }, 1000);
    expect(lastThing(1000 + 59 * 60 * 1000)).toEqual({
      target: cat, kind: 'tame', topic: cat, mentions: [{ target: { type: 'item', id: 'cod' }, field: 'eats' }, { target: cat }], at: 1000,
    });
    expect(lastThing(1000 + 60 * 60 * 1000)).toBe(null);
  });
  it('fills in kind, topic and mentions', () => {
    const guide = { type: 'guide', id: 'tame-cat' };
    rememberThing({ target: guide, topic: cat }, 5);
    expect(lastThing(5)).toEqual({ target: guide, kind: 'any', topic: cat, mentions: [], at: 5 });
  });
  it('keeps 20 mentions at most', () => {
    rememberThing({ target: cat, mentions: Array.from({ length: 30 }, () => ({ target: cat })) }, 0);
    expect(lastThing(0).mentions).toHaveLength(20);
  });
  it('ignores nothing and things with no target', () => {
    rememberThing(null);
    rememberThing({ kind: 'x' });
    expect(lastThing()).toBe(null);
  });
  it('works with the time now', () => {
    rememberThing({ target: cat });
    expect(lastThing().target).toEqual(cat);
  });
});

describe('my builds', () => {
  it('adds newest first and finds by id', () => {
    const a = addMyBuild({ name: 'Hut', photo: 'p' }, 1000);
    addMyBuild({ name: 'Tower', photo: 'q' }, 2000);
    expect(a).toEqual({ id: (1000).toString(36), name: 'Hut', photo: 'p', made: 1000 });
    expect(listMyBuilds().map((b) => b.name)).toEqual(['Tower', 'Hut']);
    expect(myBuildById(a.id)).toEqual(a);
  });
  it('null for an unknown id and an empty list', () => {
    expect(listMyBuilds()).toEqual([]);
    expect(myBuildById('x')).toBe(null);
  });
  it('null when the phone is full, and nothing old is thrown away', () => {
    addMyBuild({ name: 'Hut', photo: 'p' }, 1000);
    fullAt(5);
    expect(addMyBuild({ name: 'Big', photo: 'p' }, 2000)).toBe(null);
    vi.restoreAllMocks();
    expect(listMyBuilds().map((b) => b.name)).toEqual(['Hut']);
  });
  it('uses the time now', () => expect(addMyBuild({ name: 'a', photo: 'p' }).made).toBeGreaterThan(0));
  it('removes one', () => {
    const a = addMyBuild({ name: 'Hut', photo: 'p' }, 1000);
    removeMyBuild(a.id);
    expect(listMyBuilds()).toEqual([]);
  });
});

describe('pixel art store', () => {
  const art = (id, extra = {}) => ({ id, name: id, size: 2, blocks: ['a'], cells: [0, 0, 0, 0], ...extra });
  it('saves newest first and gets by id', () => {
    saveArt(art('a'));
    saveArt(art('b'));
    expect(listArt().map((a) => a.id)).toEqual(['b', 'a']);
    expect(getArt('a').name).toBe('a');
    expect(getArt('none')).toBe(null);
  });
  it('saving again moves it to the front once', () => {
    saveArt(art('a'));
    saveArt(art('b'));
    saveArt(art('a', { name: 'new' }));
    expect(listArt().map((a) => a.name)).toEqual(['new', 'b']);
  });
  it('keeps 12 at most', () => {
    for (let i = 0; i < 14; i++) saveArt(art(`x${i}`));
    expect(listArt()).toHaveLength(12);
    expect(listArt()[11].id).toBe('x2');
  });
  it('drops the oldest when the phone is full', () => {
    saveArt(art('old', { photo: 'x'.repeat(60) }));
    fullAt(150);
    saveArt(art('new', { photo: 'y'.repeat(60) }));
    expect(listArt().map((a) => a.id)).toEqual(['new']);
  });
  it('keeps the one when even it will not fit', () => {
    fullAt(5);
    saveArt(art('a'));
    vi.restoreAllMocks();
    expect(listArt()).toEqual([]);
  });
  it('updates one', () => {
    saveArt(art('a'));
    saveArt(art('b'));
    expect(updateArt('a', { row: 3 })).toEqual(art('a', { row: 3 }));
    expect(getArt('a').row).toBe(3);
    expect(getArt('b').row).toBe(undefined);
    expect(updateArt('none', { row: 1 })).toBe(null);
  });
  it('removes one', () => {
    saveArt(art('a'));
    removeArt('a');
    expect(listArt()).toEqual([]);
  });
  it('new ids from the time', () => {
    expect(newArtId(36)).toBe('10');
    expect(newArtId(0)).toBe('0');
    expect(newArtId().length).toBeGreaterThan(4);
  });
});

describe('recent questions', () => {
  it('newest first, three by default', () => {
    for (const q of ['a', 'b', 'c', 'd']) addRecent({ q, pic: null }, 1);
    expect(listRecent().map((e) => e.q)).toEqual(['d', 'c', 'b']);
    expect(listRecent(10)).toHaveLength(4);
  });
  it('each question once, by its clean words', () => {
    addRecent({ q: 'How do I make a cake?', pic: null }, 1);
    addRecent({ q: 'how do i make a CAKE', pic: { kind: 'item', id: 'cake' } }, 2);
    expect(listRecent(10)).toEqual([{ q: 'how do i make a CAKE', pic: { kind: 'item', id: 'cake' }, time: 2 }]);
  });
  it('keeps 20 at most', () => {
    for (let i = 0; i < 25; i++) addRecent({ q: `q${i}` }, i);
    expect(listRecent(100)).toHaveLength(20);
  });
  it('empty list and zero limit', () => {
    expect(listRecent()).toEqual([]);
    addRecent({ q: 'a' });
    expect(listRecent(0)).toEqual([]);
    expect(listRecent(1)[0].time).toBeGreaterThan(0);
  });
});

describe('photo', () => {
  it('gives the photo back for its purpose only', () => {
    const file = { name: 'a.jpg' };
    setPhoto(file, 'pixel');
    expect(getPhoto('pixel')).toBe(file);
    expect(getPhoto('idea')).toBe(null);
  });
  it('no file clears it', () => {
    setPhoto({}, 'idea');
    setPhoto(null, 'idea');
    expect(getPhoto('idea')).toBe(null);
  });
});
