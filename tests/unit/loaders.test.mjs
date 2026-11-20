import './_setup.mjs';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { loadAddons } from '../../data/load-addons.js';
import { loadBook } from '../../data/load-book.js';
import { photoPixels } from '../../data/art-photo.js';
import { readJson } from './_setup.mjs';

afterEach(() => vi.unstubAllGlobals());

// fetch that reads the repo's own files; paths in `broken` fail.
function repoFetch(broken = []) {
  return vi.fn(async (path) => (broken.includes(path) ? { ok: false } : { ok: true, json: async () => readJson(path) }));
}

describe('loadAddons', () => {
  it('loads every pack on the list', async () => {
    vi.stubGlobal('fetch', repoFetch());
    const packs = await loadAddons();
    expect(packs.map((p) => p.id)).toEqual(readJson('data/addons/index.json'));
  });
  it('no add-ons if the list will not load', async () => {
    vi.stubGlobal('fetch', repoFetch(['data/addons/index.json']));
    expect(await loadAddons()).toEqual([]);
  });
  it('no add-ons if a pack will not load', async () => {
    vi.stubGlobal('fetch', repoFetch(['data/addons/the-bloop/pack.json']));
    expect(await loadAddons()).toEqual([]);
  });
  it('no add-ons when offline', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));
    expect(await loadAddons()).toEqual([]);
  });
});

describe('loadBook', () => {
  it('loads everything and builds the search list once', async () => {
    const fetch = repoFetch();
    vi.stubGlobal('fetch', fetch);
    const ctx = await loadBook();
    expect(Object.keys(ctx).sort()).toEqual(['addons', 'book', 'builds', 'challenges', 'guides', 'list', 'tricks']);
    expect(ctx.list.length).toBeGreaterThan(1000);
    expect(ctx.addons).toHaveLength(1);
    expect(fetch).toHaveBeenCalledWith('data/book.json');
  });
  it('Finish it starters are not in the book', async () => {
    vi.stubGlobal('fetch', repoFetch());
    const { book, builds } = await loadBook();
    expect(book.builds.some((b) => b.group === 'Finish it')).toBe(false);
    expect(book.builds.length).toBeLessThan(builds.builds.length);
  });
  it('fails with the path when a file will not load', async () => {
    vi.stubGlobal('fetch', repoFetch(['data/guides.json']));
    await expect(loadBook()).rejects.toThrow("Couldn't load data/guides.json");
  });
  it('still loads without add-ons', async () => {
    vi.stubGlobal('fetch', repoFetch(['data/addons/index.json']));
    expect((await loadBook()).addons).toEqual([]);
  });
});

describe('photoPixels', () => {
  function stubCanvas() {
    const calls = {};
    const context = {
      drawImage: vi.fn((...args) => (calls.draw = args)),
      getImageData: vi.fn((x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4).fill(7) })),
    };
    const real = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag !== 'canvas') return real(tag);
      const canvas = { getContext: vi.fn((kind, opts) => ((calls.opts = opts), context)) };
      calls.canvas = canvas;
      return canvas;
    });
    vi.stubGlobal('Image', class {
      constructor() { this.naturalWidth = 200; this.naturalHeight = 100; }
      decode() { calls.src = this.src; return Promise.resolve(); }
    });
    return { calls, context };
  }
  afterEach(() => vi.restoreAllMocks());
  it('the whole photo, squashed to a square', async () => {
    const { calls, context } = stubCanvas();
    const data = await photoPixels('data:image/jpeg;base64,x', 4);
    expect(data).toHaveLength(64);
    expect(calls.src).toBe('data:image/jpeg;base64,x');
    expect(calls.canvas).toMatchObject({ width: 4, height: 4 });
    expect(calls.opts).toEqual({ willReadFrequently: true });
    expect(context.imageSmoothingEnabled).toBe(true);
    expect(context.imageSmoothingQuality).toBe('high');
    expect(calls.draw.slice(1)).toEqual([0, 0, 200, 100, 0, 0, 4, 4]);
  });
  it('a part of the photo', async () => {
    const { calls } = stubCanvas();
    await photoPixels('p.jpg', 8, { x: 0.25, y: 0.5, side: 0.5 });
    expect(calls.draw.slice(1)).toEqual([50, 50, 100, 50, 0, 0, 8, 8]);
  });
  it('a photo that will not open', async () => {
    stubCanvas();
    vi.stubGlobal('Image', class { decode() { return Promise.reject(new Error('bad photo')); } });
    await expect(photoPixels('bad.jpg', 4)).rejects.toThrow('bad photo');
  });
});
