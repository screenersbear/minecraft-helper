import './_setup.mjs';
import { describe, it, expect } from 'vitest';
import { editDistance, allowedMistakes, wordMatch } from '../../logic/spelling.js';

describe('editDistance', () => {
  it('same is 0', () => expect(editDistance('torch', 'torch')).toBe(0));
  it('one change, add or remove', () => {
    expect(editDistance('torch', 'porch')).toBe(1);
    expect(editDistance('torch', 'torchs')).toBe(1);
    expect(editDistance('torch', 'toch')).toBe(1);
  });
  it('a swap side by side is 1', () => expect(editDistance('torch', 'otrch')).toBe(1));
  it('empty words', () => {
    expect(editDistance('', 'abc')).toBe(3);
    expect(editDistance('abc', '')).toBe(3);
    expect(editDistance('', '')).toBe(0);
  });
  it('completely different', () => expect(editDistance('abc', 'xyz')).toBe(3));
  it('long words', () => expect(editDistance('enchantment', 'enchantmen')).toBe(1));
});

describe('allowedMistakes', () => {
  it('none for short words', () => {
    expect(allowedMistakes('')).toBe(0);
    expect(allowedMistakes('cat')).toBe(0);
  });
  it('1 from 4 letters to 7', () => {
    expect(allowedMistakes('cake')).toBe(1);
    expect(allowedMistakes('diamond')).toBe(1);
  });
  it('2 from 8 letters', () => {
    expect(allowedMistakes('obsidian')).toBe(2);
    expect(allowedMistakes('enchantment')).toBe(2);
  });
});

describe('wordMatch', () => {
  it('exact is 1', () => expect(wordMatch('cat', 'cat')).toBe(1));
  it('a small mistake is 0.8', () => {
    expect(wordMatch('torchs', 'torch')).toBe(0.8);
    expect(wordMatch('obsidain', 'obsidian')).toBe(0.8);
  });
  it('short words must be exact', () => expect(wordMatch('cat', 'bat')).toBe(0));
  it('the shorter word sets the limit', () => expect(wordMatch('cats', 'cat')).toBe(0));
  it('too different in length', () => expect(wordMatch('torch', 'torchesss')).toBe(0));
  it('too many mistakes', () => expect(wordMatch('torch', 'porcs')).toBe(0));
  it('empty', () => expect(wordMatch('', 'cake')).toBe(0));
});
