// Questions to add: every question the book couldn't answer, every "Not really" and every "None of these",
// with when and how often. The grown-ups screen lists them and copies them for Claude Code.
import { load, save } from './store.js';
import { cleanText } from '../logic/words.js';

const KEY = 'mc-helper.questions-to-add';

export const WHY = {
  'not-in-book': 'Not in book',
  'not-really': 'Not really',
  'none-of-these': 'None of these',
};

// why: 'not-in-book', 'not-really' or 'none-of-these'. answer: what the app showed, for "Not really".
export function logQuestion(q, why, answer = '', now = Date.now()) {
  const list = load(KEY, []);
  const key = `${why}|${cleanText(q)}`;
  const found = list.find((e) => e.key === key);
  if (found) {
    found.times += 1;
    found.last = now;
    if (answer) found.answer = answer;
  } else {
    list.push({ key, q, why, answer, times: 1, first: now, last: now });
  }
  save(KEY, list);
}

export function listQuestions() {
  return load(KEY, []).sort((a, b) => b.last - a.last);
}

export function clearQuestions() {
  save(KEY, []);
}

const timesText = (n) => (n === 1 ? 'asked once' : n === 2 ? 'asked twice' : `asked ${n} times`);

// One line under a question on the grown-ups screen: "asked 3 times" or "answer didn't help".
export function detailText(entry) {
  if (entry.why === 'not-really') return entry.times > 1 ? `answer didn't help, ${entry.times} times` : "answer didn't help";
  if (entry.why === 'none-of-these') return entry.times > 1 ? `none of the picks fit, ${entry.times} times` : 'none of the picks fit';
  return timesText(entry.times);
}

// The list as text to paste into Claude Code.
export function copyText(list, now = Date.now()) {
  const day = new Date(now).toISOString().slice(0, 10);
  const lines = list.map((e) => {
    const when = new Date(e.last).toISOString().slice(0, 10);
    const extra = e.answer ? `, the app answered with "${e.answer}"` : '';
    return `- "${e.q}" (${WHY[e.why].toLowerCase()}, ${timesText(e.times)}, last on ${when}${extra})`;
  });
  return [`Questions to add to the Minecraft Helper book (copied from the phone on ${day}):`, ...lines].join('\n');
}
