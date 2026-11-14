// My builds: photos of things kids built, each with a name, saved on the phone (localStorage). Newest first. When
// the phone is full, a new photo isn't saved (old ones are never thrown away without asking).
import { load, save } from './store.js';

const KEY = 'mc-helper.my-builds';

export function listMyBuilds() {
  return load(KEY, []);
}

export const myBuildById = (id) => listMyBuilds().find((b) => b.id === id) || null;

// build: { name, photo (a JPEG picture as text) }. Returns the saved entry, or null if the phone is full.
export function addMyBuild(build, now = Date.now()) {
  const entry = { id: now.toString(36), name: build.name, photo: build.photo, made: now };
  return save(KEY, [entry, ...listMyBuilds()]) ? entry : null;
}

export function removeMyBuild(id) {
  save(KEY, listMyBuilds().filter((b) => b.id !== id));
}
