// Ideas to build: photos of real things kids want to build (their house, a birdhouse they saw), each with a short
// title. They show on the grown-ups screen, ready to share, so a build guide can be made for the book.
import { load, save } from './store.js';

const KEY = 'mc-helper.ideas';
const KEEP = 20;

export function listIdeas() {
  return load(KEY, []);
}

// idea: { title, photo (a JPEG picture as text) }. Newest first; if the phone is full, the oldest go first.
export function saveIdea(idea, now = Date.now()) {
  const entry = { id: now.toString(36), title: idea.title, photo: idea.photo, made: now };
  const list = [entry, ...listIdeas()].slice(0, KEEP);
  while (!save(KEY, list) && list.length > 1) list.pop();
  return listIdeas().some((i) => i.id === entry.id);
}

export function removeIdea(id) {
  save(KEY, listIdeas().filter((i) => i.id !== id));
}

// "birdhouse.jpg" from "Birdhouse!": a plain file name for sharing.
export function ideaFileName(title) {
  const name = String(title || 'idea').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${name || 'idea'}.jpg`;
}
