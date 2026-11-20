import './_setup.mjs';
import { describe, it, expect } from 'vitest';
import { scoreEntry, answerType, buildNamed, findAnswer, suggest } from '../../logic/find-answer.js';
import { buildSearchList } from '../../logic/search-list.js';
import { realData } from './_setup.mjs';

const { book, guides, nicknames } = realData();
const list = buildSearchList(book, guides, nicknames);
const ask = (q) => findAnswer(q, list, book, guides);
const key = (t) => (t ? `${t.type}:${t.id}` : '');

describe('findAnswer with the real book', () => {
  // question -> [answer type, target, field or kind]
  const cases = [
    ['how do I make a cake', 'recipe', 'item:cake'],
    ['how do i make torches', 'recipe', 'item:torch'],
    ['How do I make an enchantmen table?', 'recipe', 'item:enchanting_table'],
    ['how do i make a pick axe', 'recipe', 'item:wooden_pickaxe'],
    ['where do I find diamonds', 'guide', 'guide:find-diamonds'],
    ['how do I tame a wolf', 'guide', 'guide:tame-wolf'],
    ['what does a creeper drop', 'mob', 'mob:creeper'],
    ['what pickaxe do I need for obsidian', 'fact', 'item:obsidian'],
    ['what do pandas eat', 'field', 'mob:panda', 'eats'],
    ['what gifts does a cat bring', 'field', 'mob:cat', 'gifts'],
    ['are creepers dangerous', 'field', 'mob:creeper', 'dangerous'],
    ['what is a lead used for', 'field', 'item:lead', 'uses'],
    ['does it snow in the taiga', 'biome', 'biome:taiga'],
    ['how high does sharpness go', 'enchant', 'enchant:sharpness'],
    ['speed potion', 'effect', 'effect:speed'],
    ['what is the best food', 'topic', 'topic:best-food'],
    ['how do I make an iron golem', 'where', 'mob:iron_golem'],
    ['where is a village', 'where', 'place:village'],
    ['where do pandas live', 'where', 'mob:panda'],
    ['how do I get food', 'guide', 'guide:food-fast'],
    ['how do I make a pet bed', 'build', 'build:pet-bed'],
    ['how do i make a treehouse', 'build', 'build:treehouse'],
    ['how do i ride a boat', 'guide', 'guide:make-boat'],
    ['how much does bread fill', 'fact', 'item:bread'],
    ['how do i breed cows', 'guide', 'guide:breed-animals'],
    ['how do I tame a panda', 'missing', 'mob:panda'],
  ];
  for (const [q, type, target, field] of cases) {
    it(`"${q}"`, () => {
      const a = ask(q);
      expect([a.type, key(a.target)]).toEqual([type, target]);
      if (field) expect(a.field).toBe(field);
    });
  }
  it('things not in the book', () => {
    expect(ask('what is a zebra')).toEqual({ type: 'none', kind: 'about', suggestions: [] });
    expect(ask('')).toEqual({ type: 'none', kind: 'any', suggestions: [] });
    expect(ask('gifts').type).toBe('none');
    expect(ask('eat').type).toBe('none');
  });
  it('a missing answer never suggests the thing itself', () => {
    const a = ask('how do I tame a panda');
    expect(a.kind).toBe('tame');
    expect(a.suggestions.map(key)).not.toContain('mob:panda');
  });
  it('suggestions are other things, three at most', () => {
    const a = ask('how do i make torches');
    expect(a.suggestions.length).toBeLessThanOrEqual(3);
    expect(a.suggestions.map(key)).not.toContain('item:torch');
    expect(a.suggestions.map(key)).toContain('item:soul_torch');
  });
  it('a mining question naming a tool is about the block', () => expect(key(ask('which pickaxe for obsidian').target)).toBe('item:obsidian'));
  it('a diamond from a diamond block: a guide is better than unpacking', () => expect(ask('how do I get a diamond').type).toBe('guide'));
  it('the real book finds every guide by its title', () => {
    for (const g of guides) expect(key(ask(g.title).target), g.title).toMatch(/^(guide|build|item|mob|where|place)/);
  });
});

// A small book for the corners.
const small = {
  items: {
    iron_ingot: { name: 'Iron Ingot' }, diamond: { name: 'Diamond' }, stone: { name: 'Stone' }, golem_head: { name: 'Golem Head' },
    wooden_pickaxe: { name: 'Wooden Pickaxe' }, plain: { name: 'Plain' }, sign: { name: 'Sign' },
  },
  recipes: {
    iron_ingot: [{ how: 'furnace', input: 'raw_iron' }], diamond: [{ unpack: true }], stone: [{ how: 'furnace' }], wooden_pickaxe: [{ how: 'crafting' }],
  },
  facts: { stone: { mineWith: 'wooden_pickaxe' }, diamond: { fromBlocks: [{ block: 'diamond_ore' }] }, iron_ingot: { fromMobs: ['iron_golem'] }, golem_head: {} },
  mobs: { iron_golem: { name: 'Iron Golem' }, cat: { name: 'Cat' } },
  fields: { mob: { iron_golem: { where: { say: 'Villages.', build: 'iron-golem' } }, cat: { eats: { say: 'Fish.' } } }, item: { sign: { where: { say: 'Woods.' } } } },
  places: { village: { name: 'Village', askedAs: [] } },
  biomes: { taiga: { name: 'Taiga', also: [] } },
  builds: [{ id: 'hut', name: 'Hut' }],
};
const smallGuides = [{ id: 'tame-cat', title: 'Tame a cat', askedAs: ['tame a cat'] }, { id: 'boats', title: 'Boats', askedAs: ['ride a boat'] }];
const t = (type, id) => ({ type, id });

describe('answerType', () => {
  it('guides and builds that are there', () => {
    expect(answerType(t('guide', 'tame-cat'), small, smallGuides)).toBe('guide');
    expect(answerType(t('guide', 'nope'), small, smallGuides)).toBe(null);
    expect(answerType(t('build', 'hut'), small, smallGuides)).toBe('build');
    expect(answerType(t('build', 'nope'), small, smallGuides)).toBe(null);
    expect(answerType(t('build', 'hut'), { ...small, builds: undefined }, smallGuides)).toBe(null);
  });
  it('places answer where and what, not how to make them', () => {
    expect(answerType(t('place', 'village'), small, [], 'find')).toBe('where');
    expect(answerType(t('place', 'village'), small, [])).toBe('where');
    expect(answerType(t('place', 'village'), small, [], 'make')).toBe(null);
    expect(answerType(t('place', 'nope'), small, [], 'find')).toBe(null);
    expect(answerType(t('place', 'village'), { ...small, places: undefined }, [], 'find')).toBe(null);
  });
  it('a where line for find, get with no recipe, or a mob you build', () => {
    expect(answerType(t('mob', 'iron_golem'), small, [], 'find')).toBe('where');
    expect(answerType(t('mob', 'iron_golem'), small, [], 'make')).toBe('where');
    expect(answerType(t('mob', 'iron_golem'), small, [], 'get')).toBe('where');
    expect(answerType(t('item', 'sign'), small, [], 'get')).toBe('where');
    expect(answerType(t('mob', 'iron_golem'), small, [], 'about')).toBe('mob');
  });
  it('a field for its kind of question', () => {
    expect(answerType(t('mob', 'cat'), small, [], 'food')).toBe('field');
    expect(answerType(t('mob', 'cat'), small, [], 'gifts')).toBe('mob');
  });
  it('mobs and info that are there', () => {
    expect(answerType(t('mob', 'pig'), small, [])).toBe(null);
    expect(answerType(t('biome', 'taiga'), small, [])).toBe('biome');
    expect(answerType(t('biome', 'nope'), small, [])).toBe(null);
  });
  it('fact or recipe, by the kind of question', () => {
    expect(answerType(t('item', 'stone'), small, [], 'mine')).toBe('fact');
    expect(answerType(t('item', 'stone'), small, [], 'make')).toBe('recipe');
    expect(answerType(t('item', 'stone'), small, [])).toBe('recipe');
    expect(answerType(t('item', 'iron_ingot'), small, [], 'mine')).toBe('recipe');
    expect(answerType(t('item', 'iron_ingot'), small, [], 'drops')).toBe('fact');
    expect(answerType(t('item', 'golem_head'), small, [])).toBe('fact');
    expect(answerType(t('item', 'golem_head'), small, [], 'food')).toBe(null);
  });
  it('unpack only, a where line only, or nothing', () => {
    expect(answerType(t('item', 'diamond'), small, [], 'make')).toBe('fact');
    expect(answerType(t('item', 'diamond'), { ...small, facts: {} }, [], 'make')).toBe('unpack');
    expect(answerType(t('item', 'diamond'), small, [], 'find')).toBe('fact');
    expect(answerType(t('item', 'sign'), small, [])).toBe('where');
    expect(answerType(t('item', 'plain'), small, [])).toBe(null);
  });
});

describe('scoreEntry', () => {
  const w = (...words) => words.map((x) => ({ w: x, bonus: 0 }));
  it('every word said', () => expect(scoreEntry({ words: ['iron', 'ingot'] }, w('iron', 'ingot'))).toEqual({ full: true, matched: 2, fuzzy: false, score: 22 }));
  it('some words said', () => expect(scoreEntry({ words: ['iron', 'golem'] }, w('iron'))).toEqual({ full: false, matched: 1, fuzzy: false, score: 1 }));
  it('a misspelling', () => expect(scoreEntry({ words: ['obsidian'] }, w('obsidain'))).toEqual({ full: true, matched: 1, fuzzy: true, score: 10.8 }));
  it('a joined pair counts extra', () => expect(scoreEntry({ words: ['pickaxe'] }, [{ w: 'pickaxe', bonus: 0.5 }])).toEqual({ full: true, matched: 1, fuzzy: false, score: 11.5 }));
  it('nothing said', () => expect(scoreEntry({ words: ['cake'] }, [])).toEqual({ full: false, matched: 0, fuzzy: false, score: 0 }));
});

describe('buildNamed', () => {
  const bl = [{ words: ['pet', 'bed'], phrase: 'pet bed', target: t('build', 'pet-bed') }, { words: ['cat'], target: t('mob', 'cat') }, { words: ['hut'], target: t('build', 'hut') }];
  it('a build named word for word in a make question', () => expect(buildNamed('how do I make a pet bed', bl)).toEqual(new Set(['pet', 'bed'])));
  it('the rest of the question is not about making', () => expect(buildNamed('can my pet bed be red', bl)).toBe(null));
  it('no build named', () => {
    expect(buildNamed('what gifts does a cat bring', bl)).toBe(null);
    expect(buildNamed('', [])).toBe(null);
  });
});

describe('findAnswer with a small book', () => {
  const sl = buildSearchList(small, smallGuides, {});
  const sAsk = (q) => findAnswer(q, sl, small, smallGuides);
  it('a mob you build', () => expect(sAsk('how do I make an iron golem')).toMatchObject({ type: 'where', target: t('mob', 'iron_golem'), kind: 'make' }));
  it('something said more exactly that can not answer wins over a smaller part', () => {
    const golemBook = { ...small, fields: {}, items: { ...small.items, iron: { name: 'Iron' } }, recipes: { ...small.recipes, iron: [{ how: 'crafting' }] } };
    const gl = buildSearchList(golemBook, [], {});
    expect(findAnswer('how do I make iron', gl, golemBook, [])).toMatchObject({ type: 'recipe', target: t('item', 'iron') });
    const a = findAnswer('how do I make an iron golem', gl, golemBook, []);
    expect(a.type).toBe('missing');
    expect(a.target).toEqual(t('mob', 'iron_golem'));
    expect(findAnswer('how do I tame an iron golem', gl, golemBook, []).type).toBe('missing');
  });
  it('unpacking with no guide or fact becomes the recipe', () => {
    const b = { ...small, facts: {} };
    expect(findAnswer('how do I make a diamond', buildSearchList(b, [], {}), b, [])).toMatchObject({ type: 'recipe', target: t('item', 'diamond') });
  });
  it('unpacking is not used for kinds it does not suit', () => {
    const b = { ...small, facts: {} };
    expect(findAnswer('is a diamond dangerous', buildSearchList(b, [], {}), b, []).type).toBe('missing');
  });
  it('tame questions only take guides and fields', () => {
    expect(sAsk('how do I tame a cat')).toMatchObject({ type: 'guide', target: t('guide', 'tame-cat') });
    expect(sAsk('ride a boat')).toMatchObject({ type: 'guide', target: t('guide', 'boats') });
  });
  it('a food question about a mob is about what it eats', () => expect(sAsk('what food does a cat like')).toMatchObject({ type: 'field', field: 'eats', kind: 'eats' }));
  it('a kind of question with no answer and nothing known', () => expect(sAsk('how do I tame a dragon')).toMatchObject({ type: 'none', kind: 'tame' }));
  it('in a mining question the tool it names is not the answer', () => {
    expect(sAsk('what wooden pickaxe for stone')).toMatchObject({ type: 'fact', target: t('item', 'stone'), kind: 'mine' });
  });
  it('unpacking loses a tie to a guide', () => {
    const b = { ...small, facts: {} };
    const g = [{ id: 'diamond', title: 'Diamond', askedAs: [] }];
    expect(findAnswer('how do I make a diamond', buildSearchList(b, g, {}), b, g)).toMatchObject({ type: 'guide', target: t('guide', 'diamond') });
  });
  it('unpacking gives way to the best guide that partly matches', () => {
    const b = { ...small, facts: {} };
    const g = [{ id: 'tips', title: 'Diamond tips', askedAs: [] }, { id: 'gear', title: 'Diamond gear tips', askedAs: [] }];
    expect(findAnswer('how do I make a diamond gear', buildSearchList(b, g, {}), b, g)).toMatchObject({ type: 'guide', target: t('guide', 'gear') });
  });
  it('a kind that knowing the thing is enough for gives none, not missing', () => expect(sAsk('what is a cat called').type).toBe('mob'));
});

describe('suggest', () => {
  const s = (type, id, extra = {}) => ({ type, target: t(type, id), full: true, matched: 1, score: 10, size: 1, ...extra });
  it('never the answer, each once, three at most', () => {
    const scored = [s('item', 'a'), s('item', 'a'), s('item', 'b'), s('item', 'c'), s('item', 'd'), s('item', 'e')];
    expect(suggest(scored, { target: t('item', 'a') }, 'any', [])).toEqual([t('item', 'b'), t('item', 'c'), t('item', 'd')]);
  });
  it('best match, then the better fit, then the shorter name', () => {
    const scored = [s('item', 'long', { size: 3 }), s('item', 'short'), s('mob', 'm', { score: 10 }), s('fact', 'top', { matched: 2 })];
    expect(suggest(scored, null, 'drops', [])).toEqual([t('fact', 'top'), t('mob', 'm'), t('item', 'short')]);
  });
  it('a weak part match is not offered', () => expect(suggest([s('item', 'x', { full: false, score: 0.8 })], null, 'any', [])).toEqual([]));
  it('tame questions offer guides first, then taming guides', () => {
    const tg = [{ id: 'tame-cat', askedAs: ['tame a cat'] }, { id: 'boats', askedAs: ['ride a boat'] }, { id: 'tame-wolf', askedAs: ['tame a wolf'] }];
    expect(suggest([s('item', 'x'), s('guide', 'boats')], null, 'tame', tg)).toEqual([t('guide', 'boats'), t('item', 'x'), t('guide', 'tame-cat')]);
    expect(suggest([], { target: t('guide', 'tame-cat') }, 'tame', tg)).toEqual([t('guide', 'tame-wolf')]);
  });
  it('nothing scored', () => expect(suggest([], null, 'any', [])).toEqual([]));
});
