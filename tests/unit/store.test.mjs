import './_setup.mjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { load, save } from '../../data/store.js';

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe('load', () => {
  it('reads what was saved', () => {
    localStorage.setItem('k', JSON.stringify({ a: 1 }));
    expect(load('k', null)).toEqual({ a: 1 });
  });
  it('gives the fallback when nothing is saved', () => expect(load('none', [])).toEqual([]));
  it('gives the fallback for an empty string', () => {
    localStorage.setItem('k', '');
    expect(load('k', 'x')).toBe('x');
  });
  it('gives the fallback for broken text', () => {
    localStorage.setItem('k', '{not json');
    expect(load('k', 5)).toBe(5);
  });
  it('gives the fallback when the phone will not read', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('private'); });
    expect(load('k', 'safe')).toBe('safe');
  });
});

describe('save', () => {
  it('saves and says so', () => {
    expect(save('k', [1, 2])).toBe(true);
    expect(localStorage.getItem('k')).toBe('[1,2]');
  });
  it('saves zero and empty values', () => {
    expect(save('z', 0)).toBe(true);
    expect(load('z', 9)).toBe(0);
  });
  it('says false when the phone is full', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('full'); });
    expect(save('k', 'x')).toBe(false);
  });
});
