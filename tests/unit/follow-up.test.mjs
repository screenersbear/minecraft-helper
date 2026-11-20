import './_setup.mjs';
import { describe, it, expect } from 'vitest';
import { thingOfRoute, thingWords, followUp, describeLast, withLastThing } from '../../logic/follow-up.js';
import { chipsFor, fieldQuestion, thingQuestion } from '../../logic/chips.js';
import { linkAnswer, linkHash } from '../../logic/link-hash.js';
import { ingredientHash } from '../../logic/ingredient-link.js';
import { linksIn } from '../../logic/links.js';
import { buildSearchList } from '../../logic/search-list.js';
import { realData } from './_setup.mjs';

const { book, guides, nicknames } = realData();
const list = buildSearchList(book, guides, nicknames);
const t = (type, id) => ({ type, id });
const cat = t('mob', 'cat');
const catLinks = guides.find((g) => g.id === 'tame-cat').steps.flatMap((s) => linksIn(s.say));

describe('thingOfRoute', () => {
  it('recipe, fact and where pages', () => {
    expect(thingOfRoute({ page: 'recipe', id: 'cake', q: '' })).toEqual({ target: t('item', 'cake'), kind: 'make' });
    expect(thingOfRoute({ page: 'fact', id: 'coal', q: '' })).toEqual({ target: t('item', 'coal'), kind: 'get' });
    expect(thingOfRoute({ page: 'where', id: 'mob:panda', q: '' })).toEqual({ target: t('mob', 'panda'), kind: 'find' });
  });
  it('mob, guide, info and missing pages', () => {
    expect(thingOfRoute({ page: 'mob', id: 'cat', q: '' })).toEqual({ target: cat, kind: 'any' });
    expect(thingOfRoute({ page: 'guide', id: 'tame-cat', q: 'what is it' })).toEqual({ target: t('guide', 'tame-cat'), kind: 'any' });
    expect(thingOfRoute({ page: 'biome', id: 'taiga', q: '' })).toEqual({ target: t('biome', 'taiga'), kind: 'any' });
    expect(thingOfRoute({ page: 'missing', id: 'mob:cat', q: '', kind: 'tame' })).toEqual({ target: cat, kind: 'tame' });
  });
  it('a field page asks its kind', () => {
    expect(thingOfRoute({ page: 'field', id: 'mob:cat:gifts', q: '' })).toEqual({ target: cat, kind: 'gifts' });
    expect(thingOfRoute({ page: 'field', id: 'mob:cat:nope', q: '' })).toBe(null);
  });
  it('the question asked wins over the page', () => expect(thingOfRoute({ page: 'recipe', id: 'cake', q: 'where do I find cake' }).kind).toBe('find'));
  it('nothing for pages with no thing', () => {
    expect(thingOfRoute({ page: 'make', q: '' })).toBe(null);
    expect(thingOfRoute({ page: 'grown-ups', id: 'x', q: '' })).toBe(null);
    expect(thingOfRoute({ page: 'where', id: 'junk', q: '' })).toBe(null);
  });
});

describe('thingWords', () => {
  it('words that could name a thing', () => {
    expect(thingWords('what about the sugar')).toEqual(['sugar']);
    expect(thingWords('what gifts?')).toEqual([]);
    expect(thingWords('how do I get one')).toEqual([]);
  });
  it('empty', () => expect(thingWords('')).toEqual([]));
});

describe('followUp', () => {
  const mem = { topic: cat, mentions: catLinks };
  it('facts about the topic', () => {
    expect(followUp('what gifts?', mem, book, guides, list)).toEqual({ type: 'field', target: cat, field: 'gifts', kind: 'gifts' });
    expect(followUp('what do they eat', mem, book, guides, list)).toEqual({ type: 'field', target: cat, field: 'eats', kind: 'food' });
    expect(followUp('where do they live', mem, book, guides, list)).toEqual({ type: 'where', target: cat, kind: 'find' });
  });
  it('a question naming something else is not a follow-up', () => expect(followUp('how do I tame a dragon', mem, book, guides, list)).toBe(null));
  it('no topic', () => {
    expect(followUp('what gifts?', null, book, guides, list)).toBe(null);
    expect(followUp('what gifts?', {}, book, guides, list)).toBe(null);
  });
  it('the things the last answer mentioned', () => {
    const memory = { topic: t('guide', 'tame-cat'), mentions: [{ target: t('item', 'cod') }, { target: cat }] };
    expect(followUp('what gifts', memory, book, guides, list)).toEqual({ type: 'field', target: cat, field: 'gifts', kind: 'gifts' });
  });
  it('a guide topic with nothing that knows: matched the usual way', () => expect(followUp('what gifts', { topic: t('guide', 'tame-cat') }, book, guides, list)).toBe(null));
  it('the topic by name', () => expect(followUp('what is it', mem, book, guides, list)).toMatchObject({ type: 'mob', target: cat }));
  it('a kind the topic has no answer for is missing', () => {
    expect(followUp('how do i get it', mem, book, guides, list)).toEqual({ type: 'missing', target: cat, kind: 'get', suggestions: [] });
  });
  it('nothing for a plain question that finds something else', () => expect(followUp('hi', { topic: t('item', 'zzz_unknown') }, book, guides, list)).toBe(null));
});

describe('describeLast', () => {
  it('a recipe names its parts, one each', () => {
    const last = describeLast({ target: t('item', 'cake'), kind: 'make' }, book, guides);
    expect(last.name).toBe('Cake');
    expect(last.kind).toBe('make');
    expect(last.parts).toContain('Sugar');
    expect(new Set(last.parts).size).toBe(last.parts.length);
  });
  it('a furnace recipe names its input', () => expect(describeLast({ target: t('item', 'dried_kelp') }, book, guides).parts).toEqual(['Kelp']));
  it('a smithing recipe names its slots', () => expect(describeLast({ target: t('item', 'netherite_sword') }, book, guides).parts.length).toBeGreaterThan(1));
  it('no recipe, or not an item', () => {
    expect(describeLast({ target: t('item', 'diamond') }, book, guides)).toEqual({ name: 'Diamond', kind: 'any', parts: [] });
    expect(describeLast({ target: cat, kind: 'tame' }, book, guides)).toEqual({ name: 'Cat', kind: 'tame', parts: [] });
  });
  it('nothing', () => {
    expect(describeLast(null, book, guides)).toBe(null);
    expect(describeLast({}, book, guides)).toBe(null);
  });
});

describe('withLastThing', () => {
  const last = { name: 'Cake', kind: 'make', parts: ['Milk Bucket', 'Sugar', 'Egg'] };
  it('nothing named: about the last thing', () => expect(withLastThing('how do I get it', last)).toBe('how do I get it Cake'));
  it('one of its parts, asked the same way', () => {
    expect(withLastThing('what about the sugar', last)).toBe('how do I make Sugar');
    expect(withLastThing('and eggs', last)).toBe('how do I make Egg');
    expect(withLastThing('what about the suger', last)).toBe('how do I make Sugar');
  });
  it('a part when the kind has no way to ask again', () => expect(withLastThing('sugar', { ...last, kind: 'any' })).toBe('Sugar'));
  it('something new, asked the same way', () => expect(withLastThing('what about wolves', { ...last, kind: 'tame' })).toBe('how do I tame wolves'));
  it('a question of its own stays', () => {
    expect(withLastThing('how do i make a boat', last)).toBe('how do i make a boat');
    expect(withLastThing('what about wolves', { ...last, kind: 'any' })).toBe('what about wolves');
  });
  it('its own kind is used when it says one', () => expect(withLastThing('where do I find sugar', last)).toBe('where do I find Sugar'));
  it('nothing heard, or no last thing', () => {
    expect(withLastThing('', last)).toBe('');
    expect(withLastThing('how do I get it', null)).toBe('how do I get it');
  });
});

describe('linkAnswer and linkHash', () => {
  it('where and other facts', () => {
    expect(linkAnswer({ target: cat, field: 'where' }, book, guides)).toEqual({ type: 'where', target: cat });
    expect(linkAnswer({ target: cat, field: 'gifts' }, book, guides)).toEqual({ type: 'field', target: cat, field: 'gifts' });
  });
  it('facts that are not there', () => {
    expect(linkAnswer({ target: t('mob', 'zzz'), field: 'where' }, book, guides)).toBe(null);
    expect(linkAnswer({ target: t('mob', 'zzz'), field: 'gifts' }, book, guides)).toBe(null);
  });
  it('a plain link', () => {
    expect(linkAnswer({ target: t('item', 'cod') }, book, guides)?.target).toEqual(t('item', 'cod'));
    expect(linkAnswer({ target: t('item', 'zzz') }, book, guides)).toBe(null);
  });
  it('hashes', () => {
    expect(linkHash({ target: cat, field: 'gifts' }, book, guides, 'q')).toBe('#/field/mob%3Acat%3Agifts?q=q');
    expect(linkHash({ target: cat }, book, guides)).toBe('#/mob/cat');
    expect(linkHash({ target: t('item', 'zzz') }, book, guides)).toBe(null);
  });
  it('every link in every guide goes somewhere', () => {
    for (const g of guides) for (const s of g.steps) for (const l of linksIn(s.say)) {
      if (l.target.type === 'guide') continue;
      expect(linkHash(l, book, guides), `${g.id}: ${l.text}`).toBeTruthy();
    }
  });
});

describe('ingredientHash', () => {
  const ctx = { book, guides, list };
  it('an ingredient opens how to get it, with the way back', () => {
    expect(ingredientHash('sugar', ctx, 'recipe/cake')).toBe('#/recipe/sugar?from=recipe%2Fcake');
    expect(ingredientHash('sugar', ctx)).toBe('#/recipe/sugar');
  });
  it('the first of several choices', () => expect(ingredientHash('coal|charcoal', ctx)).toBe('#/fact/coal'));
  it('any planks, found by its name', () => expect(ingredientHash('@planks', ctx)).toBe('#/recipe/oak_planks'));
  it('an address that already has a query adds from with &', () => expect(ingredientHash('milk_bucket', ctx, 'recipe/cake')).toMatch(/^#\/[a-z]+\/[^?]+\?from=recipe%2Fcake$/));
  it('a family with a query in its answer', () => {
    const tiny = { book: { items: { '@x': { name: 'X' } }, recipes: {}, facts: {}, mobs: {} }, guides: [], list: [] };
    expect(ingredientHash('@x', tiny, 'recipe/a')).toBe('');
  });
  it('nothing for unknown, empty or missing cells', () => {
    expect(ingredientHash('nonexistent_x', ctx)).toBe('');
    expect(ingredientHash('', ctx)).toBe('');
    expect(ingredientHash(null, ctx)).toBe('');
    expect(ingredientHash('@nothing', ctx)).toBe('');
  });
  it('a family found with a question in its address keeps from after &', () => {
    const g = [{ id: 'x-guide', title: 'Wood planks', askedAs: [] }];
    const b = { items: { '@planks': { name: 'Wood planks' } }, recipes: {}, facts: {}, mobs: {} };
    const c = { book: b, guides: g, list: buildSearchList(b, g, {}) };
    expect(ingredientHash('@planks', c, 'recipe/a')).toBe('#/guide/x-guide/1?q=&from=recipe%2Fa'.replace('?q=&', '?'));
  });
});

describe('fieldQuestion and thingQuestion', () => {
  it('each fact about a mob', () => {
    expect(fieldQuestion(cat, 'where', 'Cat')).toBe('Where do cats live?');
    expect(fieldQuestion(cat, 'eats', 'Cat')).toBe('What do cats eat?');
    expect(fieldQuestion(cat, 'tame', 'Cat')).toBe('How do I tame a cat?');
    expect(fieldQuestion(cat, 'breed', 'Cat')).toBe('How do I breed cats?');
    expect(fieldQuestion(cat, 'gifts', 'Cat')).toBe('What gifts do cats bring?');
    expect(fieldQuestion(cat, 'gifts', 'Cat', true)).toBe('What gifts?');
    expect(fieldQuestion(cat, 'dangerous', 'Chicken')).toBe('Are chickens dangerous?');
    expect(fieldQuestion(cat, 'nope', 'Cat')).toBe('Tell me about cats');
  });
  it('items, one or many', () => {
    expect(fieldQuestion(t('item', 'x'), 'where', 'Diamond')).toBe('Where do I find diamonds?');
    expect(fieldQuestion(t('item', 'x'), 'uses', 'Compass')).toBe('What is a compass for?');
    expect(fieldQuestion(t('item', 'x'), 'uses', 'Shears')).toBe('What are shears for?');
    expect(fieldQuestion(t('item', 'x'), 'uses', 'Cactus')).toBe('What is a cactus for?');
  });
  it('things mentioned', () => {
    expect(thingQuestion({ type: 'recipe', target: t('item', 'x') }, 'Fishing Rod')).toBe('How do I make a fishing rod?');
    expect(thingQuestion({ type: 'unpack', target: t('item', 'x') }, 'Sweet Berries')).toBe('How do I make sweet berries?');
    expect(thingQuestion({ type: 'fact', target: t('item', 'x') }, 'Coal')).toBe('How do I get coal?');
    expect(thingQuestion({ type: 'where', target: t('mob', 'x') }, 'Chicken')).toBe('Where do I find chickens?');
    expect(thingQuestion({ type: 'mob', target: t('mob', 'x') }, 'Creeper')).toBe('What is a creeper?');
    expect(thingQuestion({ type: 'guide', target: t('guide', 'x') }, 'Make a boat')).toBe('Make a boat');
    expect(thingQuestion({ type: 'biome', target: t('biome', 'x') }, 'Taiga')).toBe(null);
  });
});

describe('chipsFor', () => {
  it('after the cat guide: gifts, food, where', () => {
    expect(chipsFor({ topic: cat, links: catLinks, here: '#/guide/tame-cat/3', guide: 'tame-cat' }, book, guides).map((c) => c.label))
      .toEqual(['What gifts?', 'What do cats eat?', 'Where do cats live?']);
  });
  it('a hostile mob: where and danger', () => {
    expect(chipsFor({ topic: t('mob', 'zombie'), here: '#/mob/zombie' }, book, guides)).toEqual([
      { label: 'Where do zombies live?', hash: '#/where/mob%3Azombie?q=Where+do+zombies+live%3F' },
      { label: 'Are zombies dangerous?', hash: '#/field/mob%3Azombie%3Adangerous?q=Are+zombies+dangerous%3F' },
    ]);
  });
  it('a guide about the topic, and a fact it should have but does not', () => {
    expect(chipsFor({ topic: t('item', 'oak_boat'), here: '#/recipe/oak_boat' }, book, guides)).toEqual([
      { label: 'Make a boat', hash: '#/guide/make-boat/1?q=Make+a+boat' },
      { label: 'What is a boat for?', hash: '#/missing/item%3Aoak_boat?q=What+is+a+boat+for%3F&k=does', missing: 'Missing: oak boat, what is a boat for' },
    ]);
  });
  it('no missing buttons on the missing page itself', () => {
    expect(chipsFor({ topic: t('item', 'oak_boat'), here: '#/missing/item:oak_boat' }, book, guides).map((c) => c.label)).toEqual(['Make a boat']);
  });
  it('things mentioned, said plainly', () => {
    const links = [{ text: 'wool', target: t('item', 'white_wool') }, { text: 'logs', target: t('item', 'oak_log') }, { text: 'taiga', target: t('biome', 'taiga') }, { text: 'bed', target: t('item', 'white_bed') }];
    const chips = chipsFor({ topic: t('item', 'white_bed'), links, here: '#/recipe/white_bed', shown: ['#/guide/make-bed/1'] }, book, guides);
    expect(chips.map((c) => c.label)).toEqual(['What is a bed for?', 'How do I make a wool?', 'Where do I find logs?'].slice(0, 3));
  });
  it('a link with a full name that does not end in its words', () => {
    const chips = chipsFor({ topic: null, links: [{ text: 'stuff', target: t('item', 'oak_log') }] }, book, guides);
    expect(chips.map((c) => c.label)).toEqual(['Where do I find oak logs?']);
  });
  it('never more than three, and never the page on screen', () => {
    const chips = chipsFor({ topic: cat, links: catLinks, here: '#/field/mob:cat:gifts' }, book, guides);
    expect(chips.length).toBeLessThanOrEqual(3);
    expect(chips.map((c) => c.label)).not.toContain('What gifts?');
  });
  it('more facts about the topic when there is room', () => {
    const chips = chipsFor({ topic: cat, here: '#/mob/cat' }, book, guides);
    expect(chips).toHaveLength(3);
  });
  it('no topic and no links', () => expect(chipsFor({}, book, guides)).toEqual([]));
  it('a full row leaves no room for missing facts; links with no answer are skipped', () => {
    const links = [{ text: 'nothing', target: t('item', 'zzz_none') }, { text: 'sugar', target: t('item', 'sugar') }, { text: 'egg', target: t('item', 'egg') }, { text: 'milk', target: t('item', 'milk_bucket') }];
    const chips = chipsFor({ topic: t('item', 'zzz_thing'), links }, book, guides);
    expect(chips).toHaveLength(3);
    expect(chips.some((c) => c.missing)).toBe(false);
    expect(chipsFor({ topic: t('item', 'zzz_thing') }, book, guides)).toEqual([
      { label: 'What is a zzz_thing for?', hash: '#/missing/item%3Azzz_thing?q=What+is+a+zzz_thing+for%3F&k=does', missing: 'Missing: zzz_thing, what is a zzz thing for' },
    ]);
  });
});
