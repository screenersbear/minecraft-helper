import './_setup.mjs';
import { describe, it, expect } from 'vitest';
import { readTrail, toHash, parseHash, pathOf, crumbHash, backHash, deeperHash, hashForAnswer, whenLabel, MAX_TRAIL } from '../../logic/routes.js';

describe('readTrail', () => {
  it('splits safe steps', () => expect(readTrail('mob/cat,field/mob:cat:tame')).toEqual(['mob/cat', 'field/mob:cat:tame']));
  it('drops unsafe steps', () => expect(readTrail('mob/cat,<script>,Mob/Cat,')).toEqual(['mob/cat']));
  it('keeps the last four', () => {
    expect(MAX_TRAIL).toBe(4);
    expect(readTrail('a,b,c,d,e,f')).toEqual(['c', 'd', 'e', 'f']);
  });
  it('empty and null', () => {
    expect(readTrail('')).toEqual([]);
    expect(readTrail(null)).toEqual([]);
  });
});

describe('toHash', () => {
  it('ask is #/', () => {
    expect(toHash()).toBe('#/');
    expect(toHash({ page: 'ask', q: 'x' })).toBe('#/');
  });
  it('page, id and step', () => {
    expect(toHash({ page: 'guide', id: 'nether-portal', step: 2 })).toBe('#/guide/nether-portal/2');
    expect(toHash({ page: 'grown-ups' })).toBe('#/grown-ups');
  });
  it('leaves out empty parts but keeps step 0', () => {
    expect(toHash({ page: 'recipe', id: '', step: null })).toBe('#/recipe');
    expect(toHash({ page: 'x', id: 'y', step: 0 })).toBe('#/x/y/0');
  });
  it('encodes ids', () => expect(toHash({ page: 'where', id: 'mob:cat' })).toBe('#/where/mob%3Acat'));
  it('question, way, from, kind and trail', () => {
    expect(toHash({ page: 'recipe', id: 'cake', q: 'make a cake', way: 2, from: 'book/food', kind: 'tame', trail: ['mob/cat'] }))
      .toBe('#/recipe/cake?q=make+a+cake&way=2&from=book%2Ffood&k=tame&t=mob%2Fcat');
  });
  it('drops an unsafe from and kind, and way 0', () => {
    expect(toHash({ page: 'fact', id: 'apple', from: 'http://x.com', kind: 'A', way: 0 })).toBe('#/fact/apple');
    expect(toHash({ page: 'fact', id: 'apple', kind: 'x' })).toBe('#/fact/apple');
    expect(toHash({ page: 'fact', id: 'apple', kind: 'abcdefghijklm' })).toBe('#/fact/apple');
    expect(toHash({ page: 'fact', id: 'apple', kind: 'abcdefghijkl' })).toBe('#/fact/apple?k=abcdefghijkl');
  });
  it('a trail keeps its last four safe steps', () => {
    expect(toHash({ page: 'mob', id: 'cat', trail: ['a', 'b', 'c', 'd', 'e', 'B C'] })).toBe('#/mob/cat?t=b%2Cc%2Cd%2Ce');
  });
});

describe('parseHash', () => {
  it('ask for nothing', () => {
    const blank = { page: 'ask', id: undefined, step: undefined, way: 0, q: '', from: '', kind: '', trail: [] };
    expect(parseHash('')).toEqual(blank);
    expect(parseHash('#/')).toEqual(blank);
    expect(parseHash(null)).toEqual(blank);
  });
  it('page, id, step and query', () => {
    expect(parseHash('#/guide/nether-portal/2?q=make+a+portal&way=1&from=book/food&k=tame&t=mob/cat')).toEqual({
      page: 'guide', id: 'nether-portal', step: 2, way: 1, q: 'make a portal', from: 'book/food', kind: 'tame', trail: ['mob/cat'],
    });
  });
  it('works without # and decodes ids', () => expect(parseHash('where/mob%3Acat').id).toBe('mob:cat'));
  it('steps are at least 1', () => {
    expect(parseHash('#/g/x/0').step).toBe(1);
    expect(parseHash('#/g/x/-3').step).toBe(1);
    expect(parseHash('#/g/x/abc').step).toBe(1);
    expect(parseHash('#/g/x/12').step).toBe(12);
  });
  it('bad query values are dropped', () => {
    const r = parseHash('#/x?way=abc&from=evil.com/x&k=TAME');
    expect([r.way, r.from, r.kind]).toEqual([0, '', '']);
  });
  it('round trip', () => {
    const route = { page: 'field', id: 'mob:cat:tame', q: 'how', kind: 'tame', trail: ['mob/cat'] };
    expect(parseHash(toHash(route))).toMatchObject(route);
  });
});

describe('pathOf', () => {
  it('page, id and step', () => expect(pathOf({ page: 'guide', id: 'make-boat', step: 3 })).toBe('guide/make-boat/3'));
  it('page and id', () => expect(pathOf({ page: 'mob', id: 'cat' })).toBe('mob/cat'));
  it('page only', () => expect(pathOf({ page: 'make', id: '', step: null })).toBe('make'));
});

describe('crumbHash', () => {
  const route = { from: 'book/mobs', trail: ['mob/cat', 'field/mob:cat:tame', 'recipe/cod'] };
  it('the first step keeps from only', () => expect(crumbHash(route, 0)).toBe('#/mob/cat?from=book%2Fmobs'));
  it('later steps keep the steps before', () => expect(crumbHash(route, 2)).toBe('#/recipe/cod?from=book%2Fmobs&t=mob%2Fcat%2Cfield%2Fmob%3Acat%3Atame'));
  it('no from', () => expect(crumbHash({ trail: ['mob/cat'] }, 0)).toBe('#/mob/cat'));
});

describe('backHash', () => {
  it('one step up the trail', () => expect(backHash({ trail: ['mob/cat', 'recipe/cod'] })).toBe('#/recipe/cod?t=mob%2Fcat'));
  it('the page it came from', () => expect(backHash({ trail: [], from: 'book/food' })).toBe('#/book/food'));
  it('Ask otherwise', () => {
    expect(backHash({ trail: [] })).toBe('#/');
    expect(backHash({})).toBe('#/');
  });
});

describe('deeperHash', () => {
  it('adds the answer on screen to the trail', () => {
    expect(parseHash(deeperHash('#/field/mob:cat:tame', '#/mob/cat?from=book/mobs'))).toMatchObject({
      page: 'field', id: 'mob:cat:tame', from: 'book/mobs', trail: ['mob/cat'],
    });
  });
  it('the next page keeps its own from', () => expect(parseHash(deeperHash('#/mob/cat?from=guides', '#/recipe/cod?from=book/food')).from).toBe('guides'));
  it('from Ask, the trail stays empty', () => expect(deeperHash('#/mob/cat', '#/')).toBe('#/mob/cat'));
  it('an unsafe page is not added', () => expect(parseHash(deeperHash('#/mob/cat', '#/guide/Big Guide?t=recipe/cod')).trail).toEqual(['recipe/cod']));
  it('going back to one in the trail cuts it there', () => {
    expect(parseHash(deeperHash('#/mob/cat', '#/recipe/cod?t=mob/cat,field/mob:cat:tame')).trail).toEqual([]);
    expect(parseHash(deeperHash('#/field/mob:cat:tame', '#/recipe/cod?t=mob/cat,field/mob:cat:tame')).trail).toEqual(['mob/cat']);
  });
  it('keeps the last four', () => {
    expect(parseHash(deeperHash('#/mob/z', '#/mob/e?t=mob/a,mob/b,mob/c,mob/d')).trail).toEqual(['mob/b', 'mob/c', 'mob/d', 'mob/e']);
  });
});

describe('hashForAnswer', () => {
  const t = (type, id) => ({ type, id });
  it('none', () => expect(hashForAnswer({ type: 'none' }, 'what is x')).toBe('#/none?q=what+is+x'));
  it('guide opens step 1', () => expect(hashForAnswer({ type: 'guide', target: t('guide', 'boat') }, 'q')).toBe('#/guide/boat/1?q=q'));
  it('build', () => expect(hashForAnswer({ type: 'build', target: t('build', 'hut') }, '')).toBe('#/build/hut'));
  it('where and field, with kind', () => {
    expect(hashForAnswer({ type: 'where', target: t('mob', 'cat') }, 'q', 'find')).toBe('#/where/mob%3Acat?q=q&k=find');
    expect(hashForAnswer({ type: 'field', target: t('mob', 'cat'), field: 'tame' }, '')).toBe('#/field/mob%3Acat%3Atame');
  });
  it('missing uses the answer kind', () => expect(hashForAnswer({ type: 'missing', target: t('mob', 'cat'), kind: 'gifts' }, '', 'x')).toBe('#/missing/mob%3Acat?k=gifts'));
  it('unpack goes to recipe; others to their type', () => {
    expect(hashForAnswer({ type: 'unpack', target: t('item', 'iron_ingot') }, '')).toBe('#/recipe/iron_ingot');
    expect(hashForAnswer({ type: 'mob', target: t('mob', 'cat') }, 'cat', 'tame')).toBe('#/mob/cat?q=cat&k=tame');
  });
});

describe('whenLabel', () => {
  const at = (d, h) => new Date(2026, 10, d, h).getTime();
  it('today and tonight', () => {
    expect(whenLabel(at(20, 9), at(20, 23))).toBe('Today');
    expect(whenLabel(at(20, 18), at(20, 23))).toBe('Tonight');
    expect(whenLabel(at(20, 17), at(20, 17))).toBe('Today');
  });
  it('a time later than now still says today', () => expect(whenLabel(at(21, 9), at(20, 9))).toBe('Today'));
  it('yesterday, across midnight', () => expect(whenLabel(at(19, 23), at(20, 0))).toBe('Yesterday'));
  it('the day of the week within a week', () => {
    expect(whenLabel(at(18, 12), at(20, 12))).toBe('Wednesday');
    expect(whenLabel(at(14, 12), at(20, 12))).toBe('Saturday');
  });
  it('the date after a week, across months', () => {
    expect(whenLabel(at(13, 12), at(20, 12))).toBe('Nov 13');
    expect(whenLabel(new Date(2026, 9, 3).getTime(), at(20, 12))).toBe('Oct 3');
  });
  it('uses the time now', () => expect(whenLabel(Date.now())).toMatch(/^(Today|Tonight)$/));
});
