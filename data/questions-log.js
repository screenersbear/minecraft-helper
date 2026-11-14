// Questions to look at: everything the book couldn't answer, every "Not really" with what was wrong, and every
// answer the app knew it was missing. Each entry keeps the whole moment: the question as heard, what the app
// answered, the reason, when, and how many times. The grown-ups screen groups them by reason and copies them.
import { load, save } from './store.js';
import { cleanText } from '../logic/words.js';

const KEY = 'mc-helper.questions-to-add';

// The reasons, in the order the grown-ups screen shows them.
export const REASONS = {
  wrong: 'Wrong',
  hard: 'Hard to understand',
  'not-asked': 'Not what I asked',
  'not-in-book': 'Not in the book',
  missing: 'Missing answers',
  'not-really': "Didn't say why",
};

// Entries saved before there were reasons said why in "why".
const OLD = { 'not-in-book': 'not-in-book', 'none-of-these': 'not-in-book', 'not-really': 'not-really' };
function tidy(e) {
  if (REASONS[e.reason]) return e;
  const reason = OLD[e.why] || 'not-really';
  const answer = e.answer || (reason === 'not-in-book' ? NOT_IN_BOOK : '');
  return { key: e.key, q: e.q, answer, reason, noneFit: e.why === 'none-of-these', times: e.times || 1, first: e.first, last: e.last };
}

const all = () => load(KEY, []).map(tidy);

// One entry per question and answer: "how do i make a cake|cake recipe".
export const questionKey = (q, answer) => `${cleanText(q)}|${cleanText(answer)}`;
export const NOT_IN_BOOK = 'not in the book';

// moment: { q, answer, reason, missing }. answer: what the app answered ("Cake (recipe)", "not in the book").
// missing: what it didn't know, for missing answers ("Missing: where to find evoker").
// The same question with the same answer counts up instead of adding a line.
// Returns what Undo needs: { key, before }.
export function logQuestion({ q, answer = '', reason, missing }, now = Date.now()) {
  const list = all();
  const key = questionKey(q, answer);
  const found = list.find((e) => e.key === key);
  const before = found ? { ...found } : null;
  if (found) {
    Object.assign(found, { q, reason, times: found.times + 1, last: now });
    if (missing) found.missing = missing;
  } else {
    list.push({ key, q, answer, reason, ...(missing ? { missing } : {}), times: 1, first: now, last: now });
  }
  save(KEY, list);
  return { key, before };
}

// Changes an entry: the reason picked after "Not really", or noneFit when none of the picks fit.
export function updateQuestion(key, changes) {
  const list = all();
  const found = list.find((e) => e.key === key);
  if (!found) return false;
  Object.assign(found, changes);
  save(KEY, list);
  return true;
}

// Takes back a logQuestion (Undo, or "Oops, wrong button"): the entry goes back to how it was before.
export function undoQuestion({ key, before } = {}) {
  const list = all().filter((e) => e.key !== key);
  if (before) list.push(before);
  save(KEY, list);
}

// Removes an entry (the X on the grown-ups screen). Returns it, so Undo can put it back.
export function removeQuestion(key) {
  const list = all();
  const gone = list.find((e) => e.key === key) || null;
  save(KEY, list.filter((e) => e.key !== key));
  return gone;
}

export function restoreQuestion(entry) {
  if (!entry) return;
  save(KEY, [...all().filter((e) => e.key !== entry.key), entry]);
}

// Newest first.
export function listQuestions() {
  return all().sort((a, b) => b.last - a.last);
}

export function clearQuestions() {
  save(KEY, []);
}

// The list in groups by reason, in the order of REASONS, leaving out empty groups: [{ reason, label, entries }].
export function groupQuestions(list) {
  return Object.entries(REASONS)
    .map(([reason, label]) => ({ reason, label, entries: list.filter((e) => e.reason === reason) }))
    .filter((g) => g.entries.length);
}

export const timesText = (n) => (n === 1 ? 'asked once' : n === 2 ? 'asked twice' : `asked ${n} times`);

// What the app answered, for the grown-ups screen: "Answered: Cake (recipe)", "Not in the book".
export function answerText(entry) {
  if (entry.reason === 'missing') return entry.missing || 'Missing an answer';
  if (!entry.answer || entry.answer === NOT_IN_BOOK) return entry.noneFit ? 'Not in the book, and none of the picks fit' : 'Not in the book';
  return `Answered: ${entry.answer}`;
}

// The reason in words, for the copied list.
function reasonText(entry) {
  if (entry.reason === 'missing') return entry.missing || 'Missing an answer';
  if (entry.reason === 'not-in-book' && entry.noneFit) return 'Not in the book (none of the picks fit)';
  return REASONS[entry.reason];
}

const day = (time) => new Date(time).toISOString().slice(0, 10);

// The list as plain text to paste into Claude Code: one line per entry, with the question, the app's answer and the
// reason. Only what's still on the list.
export function copyText(list, now = Date.now()) {
  const lines = list.map((e) => {
    const answer = e.reason === 'missing' ? "it didn't know that yet" : e.answer || NOT_IN_BOOK;
    return `"${e.q}" | app answered: ${answer} | reason: ${reasonText(e)} | ${timesText(e.times)}, last on ${day(e.last)}`;
  });
  const head = `Questions from Ask the guide (${list.length}, copied ${day(now)}). Check each against the Minecraft Wiki for Bedrock and report back before changing anything:`;
  return [head, ...lines].join('\n');
}
