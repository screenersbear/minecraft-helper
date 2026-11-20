import './_setup.mjs';
import { describe, it, expect } from 'vitest';
import { parseLinks, plainText, linksIn, brokenLink } from '../../logic/links.js';

describe('parseLinks', () => {
  it('text and a link', () => {
    expect(parseLinks('Feed it [raw cod](item:cod).')).toEqual([
      { text: 'Feed it ' }, { text: 'raw cod', target: { type: 'item', id: 'cod' } }, { text: '.' },
    ]);
  });
  it('a link to one fact', () => {
    expect(parseLinks('a [gift](mob:cat#gifts)')).toEqual([{ text: 'a ' }, { text: 'gift', target: { type: 'mob', id: 'cat' }, field: 'gifts' }]);
  });
  it('a family id and links side by side', () => {
    expect(parseLinks('[bed](item:@bed)[x](guide:first-night)')).toEqual([
      { text: 'bed', target: { type: 'item', id: '@bed' } }, { text: 'x', target: { type: 'guide', id: 'first-night' } },
    ]);
  });
  it('no links', () => expect(parseLinks('just words')).toEqual([{ text: 'just words' }]));
  it('empty and null', () => {
    expect(parseLinks('')).toEqual([]);
    expect(parseLinks(null)).toEqual([]);
  });
  it('a broken link stays text', () => expect(parseLinks('[gift](cat)')).toEqual([{ text: '[gift](cat)' }]));
});

describe('plainText', () => {
  it('keeps the words of links', () => expect(plainText('Feed it [raw cod](item:cod#eats) now')).toBe('Feed it raw cod now'));
  it('no links', () => expect(plainText('hi')).toBe('hi'));
  it('null', () => expect(plainText(null)).toBe(''));
});

describe('linksIn', () => {
  it('just the links', () => expect(linksIn('a [b](item:b) c [d](mob:d)').map((l) => l.text)).toEqual(['b', 'd']));
  it('none', () => expect(linksIn('none')).toEqual([]));
  it('empty', () => expect(linksIn(undefined)).toEqual([]));
});

describe('brokenLink', () => {
  it('finds a broken link', () => {
    expect(brokenLink('a [gift](cat)')).toBe(true);
    expect(brokenLink('[x](ITEM:cod)')).toBe(true);
  });
  it('good links are fine', () => expect(brokenLink('a [gift](mob:cat#gifts)')).toBe(false));
  it('plain and empty text', () => {
    expect(brokenLink('just [words]')).toBe(false);
    expect(brokenLink(null)).toBe(false);
  });
});
