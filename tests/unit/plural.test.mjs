import './_setup.mjs';
import { describe, it, expect } from 'vitest';
import { plural, mobPlural, counted, article, listWords, capitalize } from '../../logic/plural.js';

describe('plural', () => {
  it('adds s', () => expect(plural('Egg')).toBe('eggs'));
  it('words that stay the same', () => {
    expect(plural('Sugar')).toBe('sugar');
    expect(plural('Cobblestone')).toBe('cobblestone');
  });
  it('words already ending in s stay', () => expect(plural('Oak Planks')).toBe('oak planks'));
  it('special words', () => {
    expect(plural('Potato')).toBe('potatoes');
    expect(plural('wolf')).toBe('wolves');
    expect(plural('Drowned')).toBe('drowned');
  });
  it('ch, sh, x take es', () => {
    expect(plural('Torch')).toBe('torches');
    expect(plural('bush')).toBe('bushes');
    expect(plural('box')).toBe('boxes');
  });
  it('consonant y becomes ies, vowel y takes s', () => {
    expect(plural('Sweet Berry')).toBe('sweet berries');
    expect(plural('key')).toBe('keys');
  });
  it('the word before "of" changes', () => {
    expect(plural('Eye of Ender')).toBe('eyes of ender');
    expect(plural("Jack o Lantern")).toBe('jacks o lantern');
  });
  it('count 1 stays single, and planks becomes plank', () => {
    expect(plural('Egg', 1)).toBe('egg');
    expect(plural('Oak Planks', 1)).toBe('oak plank');
  });
  it('count 0 and large counts are plural', () => {
    expect(plural('Egg', 0)).toBe('eggs');
    expect(plural('Egg', 1e6)).toBe('eggs');
  });
  it('turns non-strings into text', () => expect(plural(5)).toBe('5s'));
});

describe('mobPlural', () => {
  it('mobs named like food', () => {
    expect(mobPlural('Chicken')).toBe('chickens');
    expect(mobPlural('cod')).toBe('cod');
    expect(mobPlural('Rabbit')).toBe('rabbits');
  });
  it('other mobs use plural', () => expect(mobPlural('Creeper')).toBe('creepers'));
  it('enderman', () => expect(mobPlural('Enderman')).toBe('endermen'));
});

describe('counted', () => {
  it('many', () => expect(counted(3, 'Milk Bucket')).toBe('3 milk buckets'));
  it('one', () => expect(counted(1, 'Egg')).toBe('1 egg'));
  it('zero', () => expect(counted(0, 'Egg')).toBe('0 eggs'));
});

describe('article', () => {
  it('a', () => expect(article('Sword')).toBe('a sword'));
  it('an', () => expect(article('Egg')).toBe('an egg'));
  it('empty', () => expect(article('')).toBe('a '));
});

describe('listWords', () => {
  it('none and one', () => {
    expect(listWords([])).toBe('');
    expect(listWords(['a'])).toBe('a');
  });
  it('two', () => expect(listWords(['a', 'b'])).toBe('a and b'));
  it('three, with or', () => {
    expect(listWords(['a', 'b', 'c'])).toBe('a, b and c');
    expect(listWords(['a', 'b', 'c'], 'or')).toBe('a, b or c');
  });
});

describe('capitalize', () => {
  it('first letter', () => expect(capitalize('creepers')).toBe('Creepers'));
  it('one letter', () => expect(capitalize('a')).toBe('A'));
  it('empty stays empty', () => {
    expect(capitalize('')).toBe('');
    expect(capitalize(undefined)).toBe(undefined);
  });
});
