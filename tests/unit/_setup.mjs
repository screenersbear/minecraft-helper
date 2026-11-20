// Shared test setup: mutes speech (no test ever talks) and loads the app's real data from the repo.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { vi } from 'vitest';

const speech = { speak: vi.fn(), cancel: vi.fn(), pause: vi.fn(), resume: vi.fn(), getVoices: () => [], speaking: false };
globalThis.speechSynthesis = speech;
if (typeof window !== 'undefined') window.speechSynthesis = speech;

// Tests run from the repo folder (npm scripts and vitest both start there).
export const readJson = (path) => JSON.parse(readFileSync(join(process.cwd(), path), 'utf8'));

let real = null;
// The book, guides, nicknames, builds, tricks and challenges, as the app loads them (book.builds without Finish it).
export function realData() {
  if (real) return real;
  const book = readJson('data/book.json');
  const builds = readJson('data/builds.json');
  book.builds = builds.builds.filter((b) => b.group !== 'Finish it');
  const ids = readJson('data/addons/index.json');
  const addons = ids.map((id) => readJson(`data/addons/${id}/pack.json`));
  real = { book, builds, addons, guides: readJson('data/guides.json'), nicknames: readJson('data/nicknames.json'), tricks: readJson('data/tricks.json'), challenges: readJson('data/challenges.json') };
  return real;
}
