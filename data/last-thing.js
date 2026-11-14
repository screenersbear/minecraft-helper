// Topic memory: the last thing asked about or looked at, so a follow-up like "how do I get it?" knows what "it" is.
// Saved on the phone for an hour: { target: { type, id }, kind, topic, mentions, at }. target is the answer on
// screen (the cat guide), topic what it's about (the cat), mentions what its words linked to ([{ target, field? }]).
import { load, save } from './store.js';

const KEY = 'mc-helper.last-thing';
const KEEP = 60 * 60 * 1000;

export function rememberThing(thing, now = Date.now()) {
  if (!thing?.target) return;
  const mentions = (thing.mentions || []).slice(0, 20).map((m) => ({ target: m.target, ...(m.field ? { field: m.field } : {}) }));
  save(KEY, { target: thing.target, kind: thing.kind || 'any', topic: thing.topic || thing.target, mentions, at: now });
}

export function lastThing(now = Date.now()) {
  const thing = load(KEY, null);
  return thing?.target && now - thing.at < KEEP ? thing : null;
}
