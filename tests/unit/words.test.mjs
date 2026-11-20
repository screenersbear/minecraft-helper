import './_setup.mjs';
import { describe, it, expect } from 'vitest';
import { cleanText, splitWords, stem, isFiller, keyWords, allWords } from '../../logic/words.js';

describe('cleanText', () => {
  it('lowercases and drops punctuation', () => expect(cleanText('How do I make TORCHES?')).toBe('how do i make torches'));
  it('drops apostrophes without a space', () => expect(cleanText("creeper's spawner’s")).toBe('creepers spawners'));
  it('keeps numbers and squashes runs of symbols', () => expect(cleanText('  level  3!!--go ')).toBe('level 3 go'));
  it('is empty for empty, null and undefined', () => {
    expect(cleanText('')).toBe('');
    expect(cleanText(null)).toBe('');
    expect(cleanText(undefined)).toBe('');
  });
  it('turns non-strings into text', () => expect(cleanText(42)).toBe('42'));
});

describe('splitWords', () => {
  it('splits clean words', () => expect(splitWords('Hello, World')).toEqual(['hello', 'world']));
  it('is an empty list for nothing', () => {
    expect(splitWords('')).toEqual([]);
    expect(splitWords('?!')).toEqual([]);
  });
  it('one word', () => expect(splitWords('cake')).toEqual(['cake']));
});

describe('stem', () => {
  it('irregular words', () => {
    expect(stem('wolves')).toBe('wolf');
    expect(stem('golden')).toBe('gold');
    expect(stem('pickaxes')).toBe('pickaxe');
  });
  it('short words stay', () => {
    expect(stem('cats')).toBe('cat');
    expect(stem('bus')).toBe('bus');
    expect(stem('ops')).toBe('ops');
  });
  it('words that end in s but are not plural stay', () => {
    expect(stem('glass')).toBe('glass');
    expect(stem('cactus')).toBe('cactus');
    expect(stem('boss')).toBe('boss');
    expect(stem('octopus')).toBe('octopus');
  });
  it('ies to y', () => expect(stem('berries')).toBe('berry'));
  it('ches, shes, xes, sses drop es', () => {
    expect(stem('torches')).toBe('torch');
    expect(stem('bushes')).toBe('bush');
    expect(stem('boxes')).toBe('box');
    expect(stem('passes')).toBe('pass');
  });
  it('plain plural drops s', () => expect(stem('swords')).toBe('sword'));
  it('a word without s stays', () => expect(stem('sword')).toBe('sword'));
  it('empty word', () => expect(stem('')).toBe(''));
});

describe('isFiller', () => {
  it('filler words', () => {
    expect(isFiller('how')).toBe(true);
    expect(isFiller('minecraft')).toBe(true);
  });
  it('real words', () => expect(isFiller('torch')).toBe(false));
  it('empty', () => expect(isFiller('')).toBe(false));
});

describe('keyWords', () => {
  it('keeps the words that matter, singular', () => expect(keyWords('How do I make torches')).toEqual(['torch']));
  it('several words', () => expect(keyWords('where are the diamonds and emeralds')).toEqual(['diamond', 'emerald']));
  it('only filler gives nothing', () => expect(keyWords('how do i make it')).toEqual([]));
  it('empty', () => expect(keyWords(null)).toEqual([]));
});

describe('allWords', () => {
  it('keeps filler, singular', () => expect(allWords('Go to the Nether portals')).toEqual(['go', 'to', 'the', 'nether', 'portal']));
  it('empty', () => expect(allWords('')).toEqual([]));
});
