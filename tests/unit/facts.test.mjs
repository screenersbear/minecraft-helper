// info, target names, where, fields, understand, search list.
import './_setup.mjs';
import { describe, it, expect } from 'vitest';
import { INFO_TYPES, isInfo, infoOf, infoName } from '../../logic/info.js';
import { targetName, answerLabel } from '../../logic/target-name.js';
import { targetKey, fieldKey, parseTarget, parseFieldKey, whereOf } from '../../logic/where.js';
import { FIELDS, FIELD_LABEL, kindOfField, expectedFacts, fieldForKind, fieldOf, fieldsOf } from '../../logic/fields.js';
import { questionKind, FITS, ALL_KINDS, fitIndex, WEATHER_WORDS, KIND_WORDS } from '../../logic/understand.js';
import { plainNames, buildSearchList } from '../../logic/search-list.js';
import { realData } from './_setup.mjs';

const book = {
  items: { cake: { name: 'Cake' }, apple: { name: 'Apple' }, bread: { name: 'Bread' } },
  mobs: { cat: { name: 'Cat', kind: 'passive' }, zombie: { name: 'Zombie', kind: 'hostile' } },
  biomes: { taiga: { name: 'Taiga' } },
  topics: { 'best-food': { title: 'The best food' } },
  places: { village: { name: 'Village', say: 'In plains.' } },
  builds: [{ id: 'hut', name: 'Hut' }],
  facts: { apple: { food: { points: 4 } } },
  categories: { food: ['bread'] },
  fields: { mob: { cat: { where: { say: 'Villages.' }, gifts: { say: 'Rabbit hide.' } } }, item: { cake: { uses: { say: 'Eat it.' } } } },
};
const guides = [{ id: 'tame-cat', title: 'Tame a cat' }];

describe('info', () => {
  it('the info types', () => {
    expect(INFO_TYPES).toEqual(['biome', 'enchant', 'effect', 'topic']);
    expect(isInfo('biome')).toBe(true);
    expect(isInfo('mob')).toBe(false);
    expect(isInfo(undefined)).toBe(false);
  });
  it('the entry for a target', () => {
    expect(infoOf(book, { type: 'biome', id: 'taiga' })).toEqual({ name: 'Taiga' });
    expect(infoOf(book, { type: 'biome', id: 'nope' })).toBe(null);
    expect(infoOf(book, { type: 'enchant', id: 'x' })).toBe(null);
    expect(infoOf(book, { type: 'mob', id: 'cat' })).toBe(null);
    expect(infoOf(book, null)).toBe(null);
  });
  it('names', () => {
    expect(infoName(book, { type: 'biome', id: 'taiga' })).toBe('Taiga');
    expect(infoName(book, { type: 'topic', id: 'best-food' })).toBe('The best food');
    expect(infoName(book, { type: 'effect', id: 'speed' })).toBe('speed');
  });
});

describe('targetName', () => {
  it('each kind of target', () => {
    expect(targetName(book, guides, { type: 'mob', id: 'cat' })).toBe('Cat');
    expect(targetName(book, guides, { type: 'place', id: 'village' })).toBe('Village');
    expect(targetName(book, guides, { type: 'biome', id: 'taiga' })).toBe('Taiga');
    expect(targetName(book, guides, { type: 'guide', id: 'tame-cat' })).toBe('Tame a cat');
    expect(targetName(book, guides, { type: 'build', id: 'hut' })).toBe('Hut');
    expect(targetName(book, guides, { type: 'item', id: 'cake' })).toBe('Cake');
  });
  it('the id when it is not known', () => {
    for (const type of ['mob', 'place', 'guide', 'build', 'item']) expect(targetName(book, guides, { type, id: 'zz' })).toBe('zz');
    expect(targetName({ items: {}, mobs: {} }, [], { type: 'place', id: 'p' })).toBe('p');
    expect(targetName({ items: {}, mobs: {} }, [], { type: 'build', id: 'b' })).toBe('b');
  });
  it('answer labels', () => {
    expect(answerLabel('recipe', 'Cake')).toBe('Cake (recipe)');
    expect(answerLabel('unpack', 'Iron')).toBe('Iron (recipe)');
    expect(answerLabel('topic', 'Best')).toBe('Best (food list)');
    expect(answerLabel('where', 'Cat')).toBe('Cat (where to find)');
    expect(answerLabel('none', 'x')).toBe('x');
  });
});

describe('where', () => {
  it('keys', () => {
    expect(targetKey({ type: 'mob', id: 'evoker' })).toBe('mob:evoker');
    expect(fieldKey({ type: 'mob', id: 'cat' }, 'gifts')).toBe('mob:cat:gifts');
  });
  it('parseTarget', () => {
    expect(parseTarget('mob:evoker')).toEqual({ type: 'mob', id: 'evoker' });
    expect(parseTarget('place:village')).toEqual({ type: 'place', id: 'village' });
    expect(parseTarget('guide:x')).toBe(null);
    expect(parseTarget('mob:')).toBe(null);
    expect(parseTarget('')).toBe(null);
    expect(parseTarget(null)).toBe(null);
  });
  it('parseFieldKey', () => {
    expect(parseFieldKey('mob:cat:gifts')).toEqual({ target: { type: 'mob', id: 'cat' }, field: 'gifts' });
    expect(parseFieldKey('mob:cat:colour')).toBe(null);
    expect(parseFieldKey('mob:cat')).toBe(null);
    expect(parseFieldKey('x:cat:gifts')).toBe(null);
    expect(parseFieldKey(undefined)).toBe(null);
  });
  it('whereOf', () => {
    expect(whereOf(book, { type: 'mob', id: 'cat' })).toEqual({ say: 'Villages.' });
    expect(whereOf(book, { type: 'place', id: 'village' }).name).toBe('Village');
    expect(whereOf(book, { type: 'mob', id: 'zombie' })).toBe(null);
  });
});

describe('fields', () => {
  it('names and labels', () => {
    expect(FIELDS).toEqual(['where', 'eats', 'tame', 'breed', 'gifts', 'dangerous', 'uses']);
    for (const f of FIELDS) expect(FIELD_LABEL[f]).toBeTruthy();
  });
  it('kindOfField', () => {
    expect(kindOfField('dangerous')).toBe('danger');
    expect(kindOfField('where')).toBe('find');
    expect(kindOfField('uses')).toBe('does');
    expect(kindOfField('nope')).toBe('');
  });
  it('expectedFacts', () => {
    expect(expectedFacts(book, { type: 'mob', id: 'cat' })).toEqual(['where']);
    expect(expectedFacts(book, { type: 'mob', id: 'zombie' })).toEqual(['where', 'dangerous']);
    expect(expectedFacts(book, { type: 'mob', id: 'unknown' })).toEqual(['where', 'dangerous']);
    expect(expectedFacts(book, { type: 'item', id: 'apple' })).toEqual([]);
    expect(expectedFacts(book, { type: 'item', id: 'bread' })).toEqual([]);
    expect(expectedFacts(book, { type: 'item', id: 'cake' })).toEqual(['uses']);
    expect(expectedFacts({ items: {} }, { type: 'item', id: 'cake' })).toEqual(['uses']);
    expect(expectedFacts(book, { type: 'place', id: 'village' })).toEqual([]);
    expect(expectedFacts(book, null)).toEqual([]);
  });
  it('fieldForKind', () => {
    expect(fieldForKind('food', { type: 'mob' })).toBe('eats');
    expect(fieldForKind('food', { type: 'item' })).toBe(null);
    expect(fieldForKind('food')).toBe(null);
    expect(fieldForKind('danger')).toBe('dangerous');
    expect(fieldForKind('make')).toBe(null);
  });
  it('fieldOf and fieldsOf', () => {
    expect(fieldOf(book, { type: 'mob', id: 'cat' }, 'gifts')).toEqual({ say: 'Rabbit hide.' });
    expect(fieldOf(book, { type: 'mob', id: 'cat' }, 'tame')).toBe(null);
    expect(fieldOf(book, { type: 'place', id: 'village' }, 'where').say).toBe('In plains.');
    expect(fieldOf(book, { type: 'place', id: 'village' }, 'eats')).toBe(null);
    expect(fieldOf(book, { type: 'place', id: 'nope' }, 'where')).toBe(null);
    expect(fieldOf({}, { type: 'place', id: 'x' }, 'where')).toBe(null);
    expect(fieldOf({}, { type: 'mob', id: 'x' }, 'where')).toBe(null);
    expect(fieldOf(book, null, 'where')).toBe(null);
    expect(fieldsOf(book, { type: 'mob', id: 'cat' })).toEqual(['where', 'gifts']);
    expect(fieldsOf(book, { type: 'item', id: 'apple' })).toEqual([]);
  });
});

describe('questionKind', () => {
  const cases = {
    'what gifts does a cat bring': 'gifts', 'how do I breed cows': 'breed', 'how do I tame a wolf': 'tame', 'what does a creeper drop': 'drops',
    'how do I mine obsidian': 'mine', 'what pickaxe do I need for obsidian': 'mine', 'how high does sharpness go max': 'max',
    'where do I find diamonds': 'find', 'how do I get string': 'get', 'how do I make a cake': 'make', 'what do pandas eat': 'food',
    'does it snow in the taiga': 'weather', 'are creepers dangerous': 'danger', 'what is a lead used for': 'does',
    'what does a totem do': 'does', 'what can I do with a saddle': 'does', 'whats a compass for': 'does', 'what is a creeper': 'about',
    cake: 'any', '': 'any',
  };
  for (const [q, kind] of Object.entries(cases)) it(`"${q}" is ${kind}`, () => expect(questionKind(q)).toBe(kind));
  it('pickaxe alone is the thing, not mining', () => {
    expect(questionKind('how do I make a pickaxe')).toBe('make');
    expect(questionKind('what does a pickaxe need')).toBe('make');
    expect(questionKind('pickaxe break stone')).toBe('mine');
    expect(questionKind('for a pickaxe')).toBe('any');
  });
  it('"what" without do, does or for at the end', () => expect(questionKind('what do')).toBe('does'));
});

describe('fits', () => {
  it('every kind', () => {
    expect(ALL_KINDS).toContain('any');
    expect(ALL_KINDS).toHaveLength(Object.keys(FITS).length);
  });
  it('fitIndex', () => {
    expect(fitIndex('make', 'recipe')).toBe(0);
    expect(fitIndex('make', 'build')).toBe(1);
    expect(fitIndex('max', 'enchant')).toBe(0);
    expect(fitIndex('gifts', 'recipe')).toBe(-1);
    expect(fitIndex('nonsense', 'mob')).toBe(3);
  });
  it('word sets', () => {
    expect(WEATHER_WORDS.has('snow')).toBe(true);
    expect(WEATHER_WORDS.has('rain')).toBe(true);
    expect(KIND_WORDS.has('make')).toBe(true);
    expect(KIND_WORDS.has('pickaxe')).toBe(false);
    expect(KIND_WORDS.has('snow')).toBe(false);
  });
});

describe('plainNames', () => {
  const items = {
    white_bed: { name: 'White Bed' }, red_bed: { name: 'Red Bed' }, '@bed': { name: 'Bed' },
    wooden_pickaxe: { name: 'Wooden Pickaxe' }, iron_pickaxe: { name: 'Iron Pickaxe' }, golden_pickaxe: { name: 'Golden Pickaxe' },
    light_blue_wool: { name: 'Light Blue Wool' }, pink_wool: { name: 'Pink Wool' },
    oak_door: { name: 'Oak Door' }, door: { name: 'Door' }, spruce_door: { name: 'Spruce Door' },
    stone_axe: { name: 'Stone Axe' }, lone_thing: { name: 'Red Thing' }, apple: { name: 'Apple' },
  };
  it('a plain name for each family, pointing at the usual one', () => {
    expect(plainNames(items, () => true)).toEqual([
      { phrase: 'bed', id: 'white_bed' }, { phrase: 'pickaxe', id: 'wooden_pickaxe' }, { phrase: 'wool', id: 'light_blue_wool' },
    ]);
  });
  it('only things with an answer', () => expect(plainNames(items, (id) => id !== 'white_bed')).toEqual([{ phrase: 'pickaxe', id: 'wooden_pickaxe' }, { phrase: 'wool', id: 'light_blue_wool' }]));
  it('no items', () => expect(plainNames({}, () => true)).toEqual([]));
});

describe('buildSearchList', () => {
  const small = {
    items: { cake: { name: 'Cake' }, '@bed': { name: 'Bed' }, white_bed: { name: 'White Bed' }, red_bed: { name: 'Red Bed' }, wither_rose: { name: 'Wither' } },
    recipes: { cake: [{}], white_bed: [{}] }, facts: { red_bed: {} }, fields: { item: {} },
    mobs: { cat: { name: 'Cat' } },
    builds: [{ id: 'pet-bed', name: 'Pet bed', also: ['dog bed', 'a'] }, { id: 'hut', name: 'Hut' }],
    biomes: { taiga: { name: 'Taiga', also: ['pine forest'] } },
    enchants: { sharpness: { name: 'Sharpness' } },
    effects: { wither: { name: 'Wither', also: [] }, speed: { name: 'Speed', also: ['swiftness'] } },
    topics: { 'best-food': { title: 'The best food', askedAs: ['best food'] } },
    places: { village: { name: 'Village', askedAs: ['town'] } },
  };
  const list = buildSearchList(small, [{ id: 'tame-cat', title: 'Tame a cat', askedAs: ['how do I get a cat', 'the'] }], { _readme: 'x', workbench: 'crafting_table', kitty: 'mob:cat', 'pine land': 'biome:taiga', 'odd:thing': 'odd:thing' });
  const find = (label) => list.filter((e) => e.label === label);
  it('items, plain names and mobs', () => {
    expect(find('Cake')).toEqual([{ words: ['cake'], target: { type: 'item', id: 'cake' }, label: 'Cake' }]);
    expect(find('bed')).toEqual([{ words: ['bed'], target: { type: 'item', id: 'white_bed' }, label: 'bed' }]);
    expect(find('Cat')[0].target).toEqual({ type: 'mob', id: 'cat' });
    expect(list.some((e) => e.target.id === '@bed')).toBe(false);
  });
  it('guides and builds keep their whole phrase; filler-only phrases are skipped', () => {
    expect(find('Tame a cat').map((e) => e.phrase)).toEqual(['tame a cat', 'how do i get a cat']);
    expect(find('Pet bed').map((e) => [e.words, e.phrase])).toEqual([[['pet', 'bed'], 'pet bed'], [['dog', 'bed'], 'dog bed']]);
  });
  it('biomes, enchantments, effects, topics and places', () => {
    expect(find('Taiga').map((e) => e.words)).toEqual([['taiga'], ['pine', 'forest']]);
    expect(find('Sharpness').map((e) => e.words)).toEqual([['sharpness'], ['sharpness', 'enchantment']]);
    expect(find('Speed').map((e) => e.words.join(' '))).toEqual(['speed', 'speed effect', 'potion speed', 'speed potion', 'swiftness']);
    expect(find('The best food')[0].target).toEqual({ type: 'topic', id: 'best-food' });
    expect(find('Village').map((e) => e.words)).toEqual([['village'], ['town']]);
  });
  it('an effect named like an item is only found with "effect"', () => {
    expect(list.filter((e) => e.target.type === 'effect' && e.target.id === 'wither').map((e) => e.words.join(' '))).toEqual(['wither effect', 'potion wither', 'wither potion']);
  });
  it('nicknames', () => {
    expect(find('workbench')[0].target).toEqual({ type: 'item', id: 'crafting_table' });
    expect(find('kitty')[0].target).toEqual({ type: 'mob', id: 'cat' });
    expect(find('pine land')[0].target).toEqual({ type: 'biome', id: 'taiga' });
    expect(find('odd:thing')[0].target).toEqual({ type: 'item', id: 'odd:thing' });
    expect(find('_readme')).toEqual([]);
  });
  it('a book with no info parts', () => {
    const bare = buildSearchList({ items: {}, recipes: {}, facts: {}, mobs: {} }, [], {});
    expect(bare).toEqual([]);
  });
  it('the real book builds a big list', () => {
    const { book: real, guides: g, nicknames } = realData();
    const all = buildSearchList(real, g, nicknames);
    expect(all.length).toBeGreaterThan(2000);
    expect(all.find((e) => e.label === 'Cake').target).toEqual({ type: 'item', id: 'cake' });
  });
});
