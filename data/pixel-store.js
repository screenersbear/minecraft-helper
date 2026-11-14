// My pixel art: pictures made of blocks, saved on the phone so a kid can come back to a half-built one.
// Each: { id, name, size, blocks (block ids), cells (a place in blocks for each square, top row first), photo (a
// small picture of the photo, to make the blocks again), colours, outline, woolOnly, edits (squares the kid changed),
// swaps (blocks the kid swapped everywhere), background (whether the photo had one), row (rows built so far), made }.
import { load, save } from './store.js';

const KEY = 'mc-helper.pixel-art';
const SIZE_KEY = 'mc-helper.pixel-size';
const KEEP = 12;

export const SIZES = [16, 24, 32];

export function listArt() {
  return load(KEY, []);
}

export function getArt(id) {
  return listArt().find((a) => a.id === id) || null;
}

// Newest first. If the phone is full, the oldest ones go first.
export function saveArt(art) {
  const list = [art, ...listArt().filter((a) => a.id !== art.id)].slice(0, KEEP);
  while (!save(KEY, list) && list.length > 1) list.pop();
}

export function updateArt(id, changes) {
  const art = getArt(id);
  if (!art) return null;
  const list = listArt().map((a) => (a.id === id ? { ...a, ...changes } : a));
  save(KEY, list);
  return { ...art, ...changes };
}

export function removeArt(id) {
  save(KEY, listArt().filter((a) => a.id !== id));
}

export const newArtId = (now = Date.now()) => now.toString(36);

// The size picked last time on the Make page.
export function chosenSize() {
  const size = load(SIZE_KEY, 16);
  return SIZES.includes(size) ? size : 16;
}

export const chooseSize = (size) => save(SIZE_KEY, size);
