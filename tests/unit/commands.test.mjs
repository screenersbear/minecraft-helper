import './_setup.mjs';
import { describe, it, expect } from 'vitest';
import { parseCommand } from '../../logic/commands.js';

describe('parseCommand', () => {
  it('next, back and again', () => {
    expect(parseCommand('next')).toBe('next');
    expect(parseCommand('go back')).toBe('back');
    expect(parseCommand('again please')).toBe('again');
  });
  it('other ways kids say them', () => {
    expect(parseCommand('keep going')).toBe('next');
    expect(parseCommand('one more time')).toBe('again');
    expect(parseCommand('Previous!')).toBe('back');
  });
  it('the last one said counts', () => {
    expect(parseCommand('next no back')).toBe('back');
    expect(parseCommand('back no next')).toBe('next');
  });
  it('"what" alone means again, in a question it does not', () => {
    expect(parseCommand('What?')).toBe('again');
    expect(parseCommand('  huh ')).toBe('again');
    expect(parseCommand('what   what')).toBe('again');
    expect(parseCommand('what gifts')).toBe(null);
  });
  it('words inside other words do not count', () => expect(parseCommand('nextdoor backpack')).toBe(null));
  it('nothing heard', () => {
    expect(parseCommand('')).toBe(null);
    expect(parseCommand(null)).toBe(null);
    expect(parseCommand('how do i make a cake')).toBe(null);
  });
});
