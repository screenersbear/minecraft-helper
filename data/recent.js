// Recent questions ("Asked before" on the Ask screen): newest first, each question once.
import { load, save } from './store.js';
import { cleanText } from '../logic/words.js';

const KEY = 'mc-helper.recent';
const KEEP = 20;

// entry: { q: the question, pic: { kind: 'item' | 'mob', id } or null }
export function addRecent(entry, now = Date.now()) {
  const same = cleanText(entry.q);
  const list = load(KEY, []).filter((e) => cleanText(e.q) !== same);
  list.unshift({ ...entry, time: now });
  save(KEY, list.slice(0, KEEP));
}

export function listRecent(limit = 3) {
  return load(KEY, []).slice(0, limit);
}
