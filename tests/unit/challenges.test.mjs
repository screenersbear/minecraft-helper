import './_setup.mjs';
import { describe, it, expect } from 'vitest';
import { nextChallenge, clockText } from '../../logic/challenges.js';

const list = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

describe('nextChallenge', () => {
  it('picks one not seen yet', () => {
    const { challenge, seen } = nextChallenge(list, ['a'], () => 0);
    expect(challenge.id).toBe('b');
    expect(seen).toEqual(['a', 'b']);
  });
  it('uses the pick number', () => {
    expect(nextChallenge(list, [], () => 0.5).challenge.id).toBe('b');
    expect(nextChallenge(list, [], () => 0.99).challenge.id).toBe('c');
  });
  it('a pick of 1 still lands on the last one', () => expect(nextChallenge(list, [], () => 1).challenge.id).toBe('c'));
  it('starts over when all are seen, but not with the last one', () => {
    const { challenge, seen } = nextChallenge(list, ['a', 'b', 'c'], () => 0.99);
    expect(challenge.id).toBe('b');
    expect(seen).toEqual(['b']);
    expect(nextChallenge(list, ['b', 'c', 'a'], () => 0).challenge.id).toBe('b');
  });
  it('one challenge can repeat', () => {
    expect(nextChallenge([{ id: 'a' }], ['a'], () => 0)).toEqual({ challenge: { id: 'a' }, seen: ['a'] });
  });
  it('forgets seen ids that are no longer on the list', () => {
    expect(nextChallenge(list, ['gone', 'a'], () => 0).seen).toEqual(['a', 'b']);
  });
  it('empty list', () => expect(nextChallenge([], ['a'])).toEqual({ challenge: null, seen: [] }));
  it('works with the default seen and random pick', () => {
    const { challenge, seen } = nextChallenge(list);
    expect(list).toContain(challenge);
    expect(seen).toEqual([challenge.id]);
  });
});

describe('clockText', () => {
  it('minutes and seconds', () => expect(clockText(545)).toBe('9:05'));
  it('rounds up part seconds', () => expect(clockText(59.2)).toBe('1:00'));
  it('zero and below zero', () => {
    expect(clockText(0)).toBe('0:00');
    expect(clockText(-30)).toBe('0:00');
  });
  it('a long time', () => expect(clockText(3600)).toBe('60:00'));
});
