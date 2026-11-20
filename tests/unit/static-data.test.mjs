import './_setup.mjs';
import { describe, it, expect } from 'vitest';
import { CATEGORIES, categoryById } from '../../data/categories.js';
import { CHAPTERS, chapterById, chapterNamed } from '../../data/chapters.js';
import { PALETTES, paletteById } from '../../data/palettes.js';
import { realData } from './_setup.mjs';

describe('categories', () => {
  it('eight pages, each in the book', () => {
    const { book } = realData();
    expect(CATEGORIES).toHaveLength(8);
    for (const c of CATEGORIES) expect(book.categories[c.id]).toBeTruthy();
  });
  it('by id', () => expect(categoryById('food').name).toBe('Food'));
  it('null for unknown and empty', () => {
    expect(categoryById('nope')).toBe(null);
    expect(categoryById(undefined)).toBe(null);
  });
});

describe('chapters', () => {
  it('ten chapters with unique ids', () => expect(new Set(CHAPTERS.map((c) => c.id)).size).toBe(10));
  it('by id and by name', () => {
    expect(chapterById('ocean').name).toBe('Ocean');
    expect(chapterNamed('Nether and End').id).toBe('nether-and-end');
  });
  it('null for unknown', () => {
    expect(chapterById('x')).toBe(null);
    expect(chapterNamed('ocean')).toBe(null);
    expect(chapterNamed(undefined)).toBe(null);
  });
});

describe('palettes', () => {
  it('ten palettes of five blocks the book knows', () => {
    const { book } = realData();
    expect(PALETTES).toHaveLength(10);
    for (const p of PALETTES) {
      expect(p.blocks).toHaveLength(5);
      for (const b of p.blocks) expect(book.items[b], b).toBeTruthy();
    }
  });
  it('by id', () => expect(paletteById('candy').blocks[0]).toBe('pink_wool'));
  it('null for unknown', () => {
    expect(paletteById('none')).toBe(null);
    expect(paletteById()).toBe(null);
  });
});
