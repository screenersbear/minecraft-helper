// The last thing asked about or looked at, so a follow-up like "how do I get it?" knows what "it" is.
// Saved on the phone for an hour: { target: { type, id }, kind, at }.
import { load, save } from './store.js';

const KEY = 'mc-helper.last-thing';
const KEEP = 60 * 60 * 1000;

export function rememberThing(thing, now = Date.now()) {
  if (thing?.target) save(KEY, { target: thing.target, kind: thing.kind || 'any', at: now });
}

export function lastThing(now = Date.now()) {
  const thing = load(KEY, null);
  return thing?.target && now - thing.at < KEEP ? thing : null;
}
