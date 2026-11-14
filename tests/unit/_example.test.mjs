// EXAMPLE of the "multiple tests per piece" pattern. Delete once you have real tests.
// Every function gets tests for: the normal case, the edges, and bad input.
// The function lives inside this file so it doesn't count toward your app's coverage.
import { describe, it, expect } from 'vitest';

function shootDuration(startISO, endISO) {
  const ms = new Date(endISO) - new Date(startISO);
  if (Number.isNaN(ms)) throw new Error('invalid date');
  if (ms < 0) throw new Error('end is before start');
  return Math.round(ms / 60000);
}

describe('shootDuration', () => {
  // normal cases
  it('returns minutes between two times', () => {
    expect(shootDuration('2026-11-12T10:00', '2026-11-12T12:30')).toBe(150);
  });
  it('works across midnight', () => {
    expect(shootDuration('2026-11-12T23:00', '2026-11-13T01:00')).toBe(120);
  });
  // edges
  it('returns 0 for the same time', () => {
    expect(shootDuration('2026-11-12T10:00', '2026-11-12T10:00')).toBe(0);
  });
  it('rounds partial minutes', () => {
    expect(shootDuration('2026-11-12T10:00:00', '2026-11-12T10:00:40')).toBe(1);
  });
  // bad input
  it('rejects end before start', () => {
    expect(() => shootDuration('2026-11-12T12:00', '2026-11-12T10:00')).toThrow('before start');
  });
  it('rejects garbage', () => {
    expect(() => shootDuration('not a date', '2026-11-12T10:00')).toThrow('invalid');
  });
});
