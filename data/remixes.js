// Remixes: how each build is remixed (other wood, a palette, flipped), saved on the phone, so the cover, the layer
// pages and the block list all show the same remix. See logic/remix.js.
import { load, save } from './store.js';
import { findBuild } from '../logic/builds.js';
import { remixBuild, isRemixed } from '../logic/remix.js';

const KEY = 'mc-helper.remixes';

export const remixOf = (id) => load(KEY, {})[id] || null;

// remix: { wood, palette, flip }, or null to go back to how it was.
export function setRemix(id, remix) {
  const all = load(KEY, {});
  if (isRemixed(remix)) all[id] = remix;
  else delete all[id];
  save(KEY, all);
}

// The build with its remix, ready to show; null if there's no build with that id.
export function remixedBuild(ctx, id) {
  const build = findBuild(ctx.builds.builds, id);
  return build && remixBuild(build, remixOf(id), (b) => !!ctx.builds.blocks[b]);
}
