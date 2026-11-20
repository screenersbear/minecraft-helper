import './_setup.mjs';
import { describe, it, expect } from 'vitest';
import { crumbLabel, crumbsFor } from '../../logic/trail.js';
import { placeName } from '../../logic/place-name.js';
import { parseHash } from '../../logic/routes.js';
import { realData } from './_setup.mjs';

const { book, guides, addons, builds, tricks } = realData();
const ctx = { book, guides, addons };
const bloop = addons[0];

describe('crumbLabel', () => {
  it('names of each kind of page', () => {
    expect(crumbLabel('mob/cat', undefined, ctx)).toBe('Cat');
    expect(crumbLabel('recipe/cake', undefined, ctx)).toBe('Cake');
    expect(crumbLabel('fact/coal', undefined, ctx)).toBe('Coal');
    expect(crumbLabel('guide/tame-cat/2', undefined, ctx)).toBe('Tame a cat');
    expect(crumbLabel('biome/taiga', undefined, ctx)).toBe('Taiga');
  });
  it('facts: short after the same thing, named otherwise', () => {
    expect(crumbLabel('field/mob:cat:tame', 'mob/cat', ctx)).toBe('Taming');
    expect(crumbLabel('field/mob:cat:tame', 'recipe/cod', ctx)).toBe('Cat: Taming');
    expect(crumbLabel('field/mob:cat:tame', undefined, ctx)).toBe('Cat: Taming');
    expect(crumbLabel('where/mob:cat', 'mob/cat', ctx)).toBe('Where');
    expect(crumbLabel('where/mob:cat', 'field/mob:cat:tame', ctx)).toBe('Where');
  });
  it('a missing page names its fact from the kind', () => {
    expect(crumbLabel('missing/mob:panda', undefined, ctx, 'tame')).toBe('Panda: Taming');
    expect(crumbLabel('missing/mob:panda', 'mob/panda', ctx, 'tame')).toBe('Taming');
    expect(crumbLabel('missing/mob:panda', undefined, ctx, 'make')).toBe('Panda');
    expect(crumbLabel('missing/mob:panda', undefined, ctx)).toBe('Panda');
  });
  it('add-on answers', () => {
    expect(crumbLabel('addon/the-bloop:what', undefined, ctx)).toBe(bloop.answers.what.title);
    expect(crumbLabel('addon/the-bloop', undefined, ctx)).toBe('The Bloop');
    expect(crumbLabel('addon/nope:x', undefined, ctx)).toBe('nope:x');
  });
  it('an add-on question with no answer yet says its question', () => {
    const missingId = Object.values(bloop.answers).flatMap((a) => a.more || []).find((m) => !bloop.answers[m.id])?.id;
    if (missingId) expect(crumbLabel(`addon/the-bloop:${missingId}`, undefined, ctx)).toBeTruthy();
    const pack = { id: 'p', name: 'P', topics: [], answers: { a: { more: [{ ask: 'Why?', id: 'b' }] } } };
    expect(crumbLabel('addon/p:b', undefined, { ...ctx, addons: [pack] })).toBe('Why?');
    expect(crumbLabel('addon/p:c', undefined, { ...ctx, addons: [pack] })).toBe('P');
  });
  it('pages that are not about a thing', () => {
    expect(crumbLabel('make', undefined, ctx)).toBe('make');
    expect(crumbLabel('builds/x', undefined, ctx)).toBe('x');
    expect(crumbLabel('where/junk', undefined, ctx)).toBe('junk');
    expect(crumbLabel('field/junk', undefined, ctx)).toBe('junk');
  });
});

describe('crumbsFor', () => {
  it('the trail, with the page on screen last and unlinked', () => {
    const route = parseHash('#/field/mob:cat:tame?t=mob/cat&from=book/mobs');
    expect(crumbsFor(route, ctx)).toEqual([{ label: 'Cat', href: '#/mob/cat?from=book%2Fmobs' }, { label: 'Taming', href: '' }]);
  });
  it('the kind of question names the last page', () => {
    const route = parseHash('#/missing/mob:panda?t=mob/panda&k=tame');
    expect(crumbsFor(route, ctx).map((c) => c.label)).toEqual(['Panda', 'Taming']);
  });
  it('a regular answer with no trail has no breadcrumb', () => expect(crumbsFor(parseHash('#/mob/cat'), ctx)).toEqual([]));
  it('add-on answers start with the add-on', () => {
    expect(crumbsFor(parseHash('#/addon/the-bloop:what'), ctx)).toEqual([
      { label: 'The Bloop', href: '#/guides/ocean' }, { label: bloop.answers.what.title, href: '' },
    ]);
  });
  it('an add-on with nothing for the question: just its name', () => expect(crumbsFor(parseHash('#/addon/the-bloop'), ctx)).toEqual([{ label: 'The Bloop', href: '#/guides/ocean' }]));
  it('an add-on that is not there', () => expect(crumbsFor(parseHash('#/addon/nope:x'), ctx)).toEqual([]));
});

describe('placeName', () => {
  const pctx = { book, guides, addons, builds, tricks: Array.isArray(tricks) ? tricks : tricks.tricks };
  const cases = {
    '#/': 'Ask', '': 'Ask', '#/make': 'Make', '#/grown-ups': 'Grown-ups', '#/weird': 'Back',
    '#/book/food': 'Food', '#/book/zz': 'The book', '#/guides/ocean': 'Ocean', '#/guides/zz': 'Guides',
    '#/build/treehouse': 'Treehouse', '#/build/zz': 'Builds', '#/trick/zz': 'Builder tricks',
    '#/mine/abc': 'My builds', '#/pixel/x': 'Pixel art', '#/mob/cat': 'Cat', '#/field/mob:cat:tame': 'Cat: Taming',
    '#/addon/the-bloop:what': bloop.answers.what.title, '#/recipe/cake': 'Cake',
  };
  for (const [hash, name] of Object.entries(cases)) it(`${hash || '(empty)'} is ${name}`, () => expect(placeName(hash, pctx)).toBe(name));
  it('a trick by its name', () => expect(placeName(`#/trick/${pctx.tricks[0].id}/1`, pctx)).toBe(pctx.tricks[0].name));
  it('without the pages loaded yet', () => {
    expect(placeName('#/mob/cat')).toBe('Back');
    expect(placeName('#/book/food')).toBe('Food');
    expect(placeName('#/build/treehouse')).toBe('Builds');
    expect(placeName('#/trick/x')).toBe('Builder tricks');
  });
  it('a page with no name says Back', () => expect(placeName('#/where/junk', pctx)).toBe('junk'));
  it('an empty label says Back', () => expect(placeName('#/addon/p:x', { ...pctx, addons: [{ id: 'p', name: '', topics: [], answers: {} }] })).toBe('Back'));
});
