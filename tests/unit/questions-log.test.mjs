import './_setup.mjs';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  REASONS, questionKey, NOT_IN_BOOK, logQuestion, updateQuestion, undoQuestion, removeQuestion, restoreQuestion,
  listQuestions, clearQuestions, groupQuestions, timesText, answerText, copyText,
} from '../../data/questions-log.js';

const KEY = 'mc-helper.questions-to-add';
beforeEach(() => localStorage.clear());

describe('questionKey', () => {
  it('clean question and answer', () => expect(questionKey('How do I make a CAKE?', 'Cake (recipe)')).toBe('how do i make a cake|cake recipe'));
  it('empty answer', () => expect(questionKey('hi', '')).toBe('hi|'));
  it('nothing', () => expect(questionKey(null, undefined)).toBe('|'));
});

describe('logQuestion', () => {
  it('adds a new entry and says there was none before', () => {
    expect(logQuestion({ q: 'what is a bloop', reason: 'not-in-book' }, 100)).toEqual({ key: 'what is a bloop|', before: null });
    expect(listQuestions()).toEqual([{ key: 'what is a bloop|', q: 'what is a bloop', answer: '', reason: 'not-in-book', times: 1, first: 100, last: 100 }]);
  });
  it('the same question and answer counts up', () => {
    logQuestion({ q: 'Cake?', answer: 'Cake', reason: 'wrong' }, 100);
    const undo = logQuestion({ q: 'cake', answer: 'Cake', reason: 'hard', missing: 'Missing: cake, why' }, 200);
    expect(undo.before).toMatchObject({ q: 'Cake?', times: 1, reason: 'wrong' });
    expect(listQuestions()).toEqual([{ key: 'cake|cake', q: 'cake', answer: 'Cake', reason: 'hard', times: 2, first: 100, last: 200, missing: 'Missing: cake, why' }]);
  });
  it('counting up without missing keeps the old missing', () => {
    logQuestion({ q: 'a', reason: 'missing', missing: 'Missing: a' }, 1);
    logQuestion({ q: 'a', reason: 'missing' }, 2);
    expect(listQuestions()[0].missing).toBe('Missing: a');
  });
  it('a new missing entry keeps what was missing', () => {
    logQuestion({ q: 'what do pandas eat', answer: 'Panda', reason: 'missing', missing: 'Missing: panda, what eat' }, 1);
    expect(listQuestions()[0].missing).toBe('Missing: panda, what eat');
  });
  it('uses the time now', () => {
    logQuestion({ q: 'x', reason: 'wrong' });
    expect(listQuestions()[0].first).toBeGreaterThan(0);
  });
});

describe('old entries', () => {
  it('are given reasons from "why"', () => {
    localStorage.setItem(KEY, JSON.stringify([
      { key: 'a|', q: 'a', why: 'none-of-these', first: 1, last: 1 },
      { key: 'b|x', q: 'b', answer: 'x', why: 'not-really', times: 3, first: 2, last: 2 },
      { key: 'c|', q: 'c', why: 'something else', first: 3, last: 3 },
      { key: 'd|', q: 'd', why: 'not-in-book', first: 4, last: 4 },
    ]));
    expect(listQuestions()).toEqual([
      { key: 'd|', q: 'd', answer: NOT_IN_BOOK, reason: 'not-in-book', noneFit: false, times: 1, first: 4, last: 4 },
      { key: 'c|', q: 'c', answer: '', reason: 'not-really', noneFit: false, times: 1, first: 3, last: 3 },
      { key: 'b|x', q: 'b', answer: 'x', reason: 'not-really', noneFit: false, times: 3, first: 2, last: 2 },
      { key: 'a|', q: 'a', answer: NOT_IN_BOOK, reason: 'not-in-book', noneFit: true, times: 1, first: 1, last: 1 },
    ]);
  });
});

describe('updateQuestion', () => {
  it('changes an entry', () => {
    const { key } = logQuestion({ q: 'a', reason: 'not-really' }, 1);
    expect(updateQuestion(key, { reason: 'wrong' })).toBe(true);
    expect(listQuestions()[0].reason).toBe('wrong');
  });
  it('false for an unknown key', () => expect(updateQuestion('nope', { reason: 'wrong' })).toBe(false));
});

describe('undoQuestion', () => {
  it('takes back a new entry', () => {
    undoQuestion(logQuestion({ q: 'a', reason: 'wrong' }, 1));
    expect(listQuestions()).toEqual([]);
  });
  it('puts a counted-up entry back how it was', () => {
    logQuestion({ q: 'a', reason: 'wrong' }, 1);
    undoQuestion(logQuestion({ q: 'a', reason: 'hard' }, 2));
    expect(listQuestions()).toEqual([{ key: 'a|', q: 'a', answer: '', reason: 'wrong', times: 1, first: 1, last: 1 }]);
  });
  it('nothing to undo changes nothing', () => {
    logQuestion({ q: 'a', reason: 'wrong' }, 1);
    undoQuestion();
    expect(listQuestions()).toHaveLength(1);
  });
});

describe('remove, restore and clear', () => {
  it('removes one and gives it back', () => {
    const { key } = logQuestion({ q: 'a', reason: 'wrong' }, 1);
    logQuestion({ q: 'b', reason: 'wrong' }, 2);
    const gone = removeQuestion(key);
    expect(gone.q).toBe('a');
    expect(listQuestions().map((e) => e.q)).toEqual(['b']);
    restoreQuestion(gone);
    expect(listQuestions().map((e) => e.q)).toEqual(['b', 'a']);
  });
  it('restoring twice keeps one', () => {
    const { key } = logQuestion({ q: 'a', reason: 'wrong' }, 1);
    const gone = removeQuestion(key);
    restoreQuestion(gone);
    restoreQuestion(gone);
    expect(listQuestions()).toHaveLength(1);
  });
  it('removing an unknown key gives null; restoring null does nothing', () => {
    expect(removeQuestion('x')).toBe(null);
    restoreQuestion(null);
    expect(listQuestions()).toEqual([]);
  });
  it('clears all', () => {
    logQuestion({ q: 'a', reason: 'wrong' }, 1);
    clearQuestions();
    expect(listQuestions()).toEqual([]);
  });
});

describe('groupQuestions', () => {
  it('groups by reason in order, leaving out empty groups', () => {
    const list = [{ reason: 'missing', q: 'm' }, { reason: 'wrong', q: 'w1' }, { reason: 'wrong', q: 'w2' }];
    expect(groupQuestions(list)).toEqual([
      { reason: 'wrong', label: REASONS.wrong, entries: [list[1], list[2]] },
      { reason: 'missing', label: 'Missing answers', entries: [list[0]] },
    ]);
  });
  it('empty list', () => expect(groupQuestions([])).toEqual([]));
  it('unknown reasons are left out', () => expect(groupQuestions([{ reason: 'odd' }])).toEqual([]));
});

describe('timesText', () => {
  it('once, twice, many', () => {
    expect(timesText(1)).toBe('asked once');
    expect(timesText(2)).toBe('asked twice');
    expect(timesText(3)).toBe('asked 3 times');
    expect(timesText(1000)).toBe('asked 1000 times');
  });
  it('zero', () => expect(timesText(0)).toBe('asked 0 times'));
});

describe('answerText', () => {
  it('missing', () => {
    expect(answerText({ reason: 'missing', missing: 'Missing: cat, gifts' })).toBe('Missing: cat, gifts');
    expect(answerText({ reason: 'missing' })).toBe('Missing an answer');
  });
  it('not in the book', () => {
    expect(answerText({ reason: 'not-in-book', answer: '' })).toBe('Not in the book');
    expect(answerText({ reason: 'wrong', answer: NOT_IN_BOOK })).toBe('Not in the book');
    expect(answerText({ reason: 'not-in-book', answer: NOT_IN_BOOK, noneFit: true })).toBe('Not in the book, and none of the picks fit');
  });
  it('an answer', () => expect(answerText({ reason: 'wrong', answer: 'Cake (recipe)' })).toBe('Answered: Cake (recipe)'));
});

describe('copyText', () => {
  const day = Date.UTC(2026, 10, 14, 12);
  it('one line per entry under a heading', () => {
    const list = [
      { q: 'cake?', answer: 'Cake (recipe)', reason: 'wrong', times: 1, last: day },
      { q: 'panda food', answer: 'Panda', reason: 'missing', missing: 'Missing: panda, food', times: 2, last: day },
      { q: 'missing', reason: 'missing', times: 3, last: day },
      { q: 'bloop', answer: '', reason: 'not-in-book', noneFit: true, times: 1, last: day },
      { q: 'x', answer: '', reason: 'not-in-book', times: 1, last: day },
    ];
    expect(copyText(list, Date.UTC(2026, 10, 15)).split('\n')).toEqual([
      'Questions from Ask the guide (5, copied 2026-11-15). Check each against the Minecraft Wiki for Bedrock and report back before changing anything:',
      '"cake?" | app answered: Cake (recipe) | reason: Wrong | asked once, last on 2026-11-14',
      '"panda food" | app answered: it didn\'t know that yet | reason: Missing: panda, food | asked twice, last on 2026-11-14',
      '"missing" | app answered: it didn\'t know that yet | reason: Missing an answer | asked 3 times, last on 2026-11-14',
      '"bloop" | app answered: not in the book | reason: Not in the book (none of the picks fit) | asked once, last on 2026-11-14',
      '"x" | app answered: not in the book | reason: Not in the book | asked once, last on 2026-11-14',
    ]);
  });
  it('an empty list is just the heading, with today', () => {
    expect(copyText([])).toMatch(/^Questions from Ask the guide \(0, copied \d{4}-\d\d-\d\d\)/);
    expect(copyText([]).split('\n')).toHaveLength(1);
  });
});
