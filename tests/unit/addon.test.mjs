import './_setup.mjs';
import { describe, it, expect } from 'vitest';
import {
  MAYBE, addonOf, addonKey, turnedOn, isSure, askFor, moreOf, besideOf, treeOf, addonPic, changesFor, countBehind, behindLabel, addonMissing,
} from '../../logic/addon.js';
import { findInAddon } from '../../logic/addon-search.js';
import { namedAddon, addonOnly } from '../../logic/addon-ask.js';
import { chapterGuides, chapterTopics, addonHome } from '../../logic/chapters.js';
import { CHAPTERS, chapterById } from '../../data/chapters.js';
import { realData } from './_setup.mjs';

// A small pack: two topics; "a" leads to "b" and to "gone" (not written); "b" leads back to "a" and to "c".
const pack = {
  id: 'toy', name: 'Toy Box', chapter: 'ocean', pics: { a: 'apple', t2: 'stick' },
  sources: { site: { official: true }, fan: { official: false } },
  topics: ['a', 't2'],
  ownWords: ['robot', 'big robots'],
  changes: { cat: { answer: 'b', say: 'Cats glow.', from: ['fan'] }, dog: { answer: 'a', say: 'Dogs fly.', from: ['site'] } },
  answers: {
    a: { title: 'All about toys', say: 'Toys are fun.', words: ['toy'], from: ['site'], more: [{ ask: 'What robots?', id: 'b' }, { ask: 'Lasers?', id: 'gone' }] },
    t2: { title: 'Second topic', say: 'More here.', from: ['fan'] },
    b: { title: 'Robots', say: 'A robot has laser beams.', words: ['robot'], more: [{ ask: 'Back to toys', id: 'a' }, { ask: 'Deeper', id: 'c' }] },
    c: { title: 'Deep', say: 'Very deep.' },
  },
};
const other = { id: 'other', name: 'Other', topics: ['x'], answers: { x: { title: 'X' } } };

describe('addonOf and addonKey', () => {
  it('pack and answer', () => expect(addonOf([other, pack], 'toy:b')).toEqual({ pack, id: 'b' }));
  it('just the pack', () => expect(addonOf([pack], 'toy')).toEqual({ pack, id: '' }));
  it('null for an unknown pack, no packs and no key', () => {
    expect(addonOf([pack], 'nope:a')).toBe(null);
    expect(addonOf(null, 'toy')).toBe(null);
    expect(addonOf([pack], undefined)).toBe(null);
  });
  it('keys', () => {
    expect(addonKey(pack, 'b')).toBe('toy:b');
    expect(addonKey(pack, '')).toBe('toy');
  });
  it('MAYBE wording', () => expect(MAYBE).toBe('This might be different in your version.'));
});

describe('turnedOn', () => {
  it('leaves out the ones turned off', () => expect(turnedOn([pack, other], ['toy'])).toEqual([other]));
  it('all on with no list', () => expect(turnedOn([pack, other])).toEqual([pack, other]));
  it('no packs', () => expect(turnedOn(undefined, ['x'])).toEqual([]));
});

describe('isSure', () => {
  it('official source', () => expect(isSure(pack, pack.answers.a)).toBe(true));
  it('only an unofficial one', () => expect(isSure(pack, pack.answers.t2)).toBe(false));
  it('no sources, or a pack without sources', () => {
    expect(isSure(pack, pack.answers.c)).toBe(false);
    expect(isSure({}, { from: ['site'] })).toBe(false);
  });
});

describe('askFor, moreOf and besideOf', () => {
  it('the question that leads to an answer', () => {
    expect(askFor(pack, 'b')).toBe('What robots?');
    expect(askFor(pack, 'gone')).toBe('Lasers?');
  });
  it('nothing leads to a topic', () => expect(askFor(pack, 't2')).toBe(''));
  it('more questions, marking missing ones', () => {
    expect(moreOf(pack, 'a')).toEqual([{ ask: 'What robots?', id: 'b', missing: false }, { ask: 'Lasers?', id: 'gone', missing: true }]);
  });
  it('no more questions', () => {
    expect(moreOf(pack, 'c')).toEqual([]);
    expect(moreOf(pack, 'unknown')).toEqual([]);
  });
  it('the questions next to a missing one', () => expect(besideOf(pack, 'gone')).toEqual([{ ask: 'What robots?', id: 'b', missing: false }]));
  it('nothing beside a topic', () => expect(besideOf(pack, 't2')).toEqual([]));
});

describe('treeOf', () => {
  it('each answer hangs from the first that leads to it', () => {
    expect([...treeOf(pack)]).toEqual([['a', null], ['t2', null], ['b', 'a'], ['gone', 'a'], ['c', 'b']]);
  });
  it('a topic stays a topic even when linked to', () => {
    const p = { topics: ['a', 'b'], answers: { a: { more: [{ id: 'b' }] }, b: {} } };
    expect(treeOf(p).get('b')).toBe(null);
  });
  it('no topics', () => expect(treeOf({ topics: [], answers: {} }).size).toBe(0));
});

describe('addonPic', () => {
  it('the topic picture', () => {
    expect(addonPic(pack, 'c')).toBe('apple');
    expect(addonPic(pack, 't2')).toBe('stick');
  });
  it('an unknown id uses the first topic', () => expect(addonPic(pack, 'zzz')).toBe('apple'));
  it('null with no pictures', () => expect(addonPic(other, 'x')).toBe(null));
});

describe('changesFor', () => {
  it('what an add-on changes about a mob', () => {
    expect(changesFor([pack, other], { type: 'mob', id: 'cat' })).toEqual([{ pack, id: 'b', say: 'In Toy Box add-on, cats glow.', sure: false }]);
    expect(changesFor([pack], { type: 'mob', id: 'dog' })[0].sure).toBe(true);
  });
  it('nothing for items, unknown mobs and no packs', () => {
    expect(changesFor([pack], { type: 'item', id: 'cat' })).toEqual([]);
    expect(changesFor([pack], { type: 'mob', id: 'pig' })).toEqual([]);
    expect(changesFor(null, { type: 'mob', id: 'cat' })).toEqual([]);
    expect(changesFor([pack], null)).toEqual([]);
  });
  it('the real Bloop changes the drowned', () => {
    const { addons } = realData();
    expect(changesFor(addons, { type: 'mob', id: 'drowned' })[0].say).toMatch(/^In The Bloop add-on, there are deep sea drowned/);
  });
});

describe('countBehind and behindLabel', () => {
  it('counts the written answers under a topic', () => {
    expect(countBehind(pack, 'a')).toBe(2);
    expect(countBehind(pack, 't2')).toBe(0);
    expect(countBehind(pack, 'b')).toBe(1);
  });
  it('labels', () => {
    expect(behindLabel(0)).toBe('');
    expect(behindLabel(1)).toBe('1 more answer');
    expect(behindLabel(3)).toBe('3 more answers');
  });
  it('the real Bloop', () => {
    const bloop = realData().addons[0];
    const total = bloop.topics.reduce((n, t) => n + countBehind(bloop, t), 0);
    expect(total + bloop.topics.length).toBeLessThanOrEqual(Object.keys(bloop.answers).length);
  });
});

describe('addonMissing', () => {
  it('names the add-on and the question', () => expect(addonMissing(pack, 'What are the NEW enchantments?')).toBe('Missing (Toy Box): what are the new enchantments'));
  it('an empty question', () => expect(addonMissing(pack, '')).toBe('Missing (Toy Box): something'));
});

describe('findInAddon', () => {
  it('a question that only names the add-on gets the first topic', () => {
    expect(findInAddon(pack, 'what is the toy box')).toBe('a');
    expect(findInAddon(pack, '')).toBe('a');
  });
  it('matches titles, asks and words', () => {
    expect(findInAddon(pack, 'tell me about robots')).toBe('b');
    expect(findInAddon(pack, 'second topic')).toBe('t2');
  });
  it('a word only in what an answer says is not enough', () => expect(findInAddon(pack, 'beam')).toBe(null));
  it('what an answer says breaks a tie', () => {
    const p = { name: 'P', topics: ['a', 'b'], answers: { a: { title: 'Fish', say: 'no' }, b: { title: 'Fish', say: 'big shark' } } };
    expect(findInAddon(p, 'fish shark')).toBe('b');
    expect(findInAddon(p, 'fish')).toBe('a');
  });
  it('finds questions with no answer written yet', () => expect(findInAddon(pack, 'lasers')).toBe('gone'));
  it('nothing matches', () => expect(findInAddon(pack, 'zebra')).toBe(null));
  it('the real Bloop: getting out finds the inside, the boss finds the boss', () => {
    const bloop = realData().addons[0];
    expect(findInAddon(bloop, 'what is the bloop')).toBe('what');
    expect(findInAddon(bloop, 'how do I beat the boss')).toBeTruthy();
  });
});

describe('namedAddon', () => {
  it('every word of the name said', () => {
    expect(namedAddon([other, pack], 'what is in the toy box')).toBe(pack);
    expect(namedAddon(realData().addons, 'how do I get out of the bloop').id).toBe('the-bloop');
  });
  it('only some words of the name', () => expect(namedAddon([pack], 'my toy')).toBe(null));
  it('a pack whose name is all filler words is never named', () => expect(namedAddon([{ name: 'The' }], 'the')).toBe(null));
  it('no packs', () => expect(namedAddon(null, 'toy box')).toBe(null));
});

describe('addonOnly', () => {
  it('a question naming something only the add-on has', () => expect(addonOnly([other, pack], 'can I ride a robot')).toEqual({ pack, id: 'b' }));
  it('one of several own words', () => expect(addonOnly([pack], 'big robots')).toEqual({ pack, id: 'b' }));
  it('own words with no answer found', () => expect(addonOnly([{ ...pack, ownWords: ['zebra'] }], 'zebra')).toBe(null));
  it('an own word whose answer is not written yet', () => {
    const p = { ...pack, ownWords: ['lasers'] };
    expect(addonOnly([p], 'lasers')).toBe(null);
  });
  it('no own words, or nothing named', () => {
    expect(addonOnly([other], 'robot')).toBe(null);
    expect(addonOnly([pack], 'how do I make a boat')).toBe(null);
    expect(addonOnly(undefined, 'robot')).toBe(null);
  });
  it('the real Bloop knows the submarine', () => expect(addonOnly(realData().addons, 'can I ride a submarine')?.pack.id).toBe('the-bloop'));
});

describe('chapters', () => {
  const guides = [{ id: 'g1', group: 'Ocean' }, { id: 'g2' }, { id: 'g3', group: 'Nowhere' }, { id: 'g4', group: 'Getting started' }];
  it('the guides in a chapter, in order', () => expect(chapterGuides(guides, chapterById('ocean')).map((g) => g.id)).toEqual(['g1']));
  it('no chapter or an unknown one goes in Getting started', () => expect(chapterGuides(guides, CHAPTERS[0]).map((g) => g.id)).toEqual(['g2', 'g3', 'g4']));
  it('no guides', () => expect(chapterGuides(undefined, CHAPTERS[0])).toEqual([]));
  it('every real guide lands in a chapter', () => {
    const { guides: real } = realData();
    expect(CHAPTERS.reduce((n, c) => n + chapterGuides(real, c).length, 0)).toBe(real.length);
  });
  it('add-on topics in a chapter, with pictures', () => {
    expect(chapterTopics([pack, other], chapterById('ocean'))).toEqual([
      { pack, id: 'a', title: 'All about toys', pic: 'apple' }, { pack, id: 't2', title: 'Second topic', pic: 'stick' },
    ]);
  });
  it('a topic with no picture uses the chapter picture; an unwritten topic is left out', () => {
    const p = { chapter: 'farming', topics: ['x', 'y'], answers: { x: { title: 'X' } } };
    expect(chapterTopics([p], chapterById('farming'))).toEqual([{ pack: p, id: 'x', title: 'X', pic: 'wheat' }]);
  });
  it('no topics or no packs', () => {
    expect(chapterTopics([{ chapter: 'farming' }], chapterById('farming'))).toEqual([]);
    expect(chapterTopics(null, CHAPTERS[0])).toEqual([]);
    expect(chapterTopics([pack], chapterById('farming'))).toEqual([]);
  });
  it('an add-on home', () => {
    expect(addonHome(pack)).toBe('#/guides/ocean');
    expect(addonHome({})).toBe('#/guides');
    expect(addonHome(null)).toBe('#/guides');
  });
});
