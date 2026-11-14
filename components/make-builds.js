// The Builds part of the Make page: picture tiles of every build, with buttons to show only Easy, Medium or Big
// ones. Room ideas (small builds for inside a house) have their own list under the builds.
import { el } from './el.js';
import { buildPicture } from './build-picture.js';
import { DIFFICULTIES, filterBuilds, buildCounts, totalOf } from '../logic/builds.js';
import { toHash } from '../logic/routes.js';

const SHOW = ['All', ...DIFFICULTIES];

function tile(build, looks) {
  const total = totalOf(buildCounts(build));
  return el(
    'a',
    { class: 'build-tile notch', href: toHash({ page: 'build', id: build.id }) },
    el('span', { class: 'tile-picture' }, buildPicture(build, looks, { w: 140, h: 100, label: '' })),
    el('b', {}, build.name),
    el('small', {}, `${build.difficulty} · ${total} block${total === 1 ? '' : 's'}`),
  );
}

function group(title, builds, looks) {
  if (!builds.length) return null;
  return el('section', { class: 'build-group' }, el('h2', { class: 'small-label' }, title), el('div', { class: 'build-grid' }, builds.map((b) => tile(b, looks))));
}

// showing: 'All', 'Easy', 'Medium' or 'Big'. onShow(which): when a filter button is tapped.
export function makeBuilds(ctx, showing, onShow) {
  const { builds, blocks } = ctx.builds || { builds: [], blocks: {} };
  const shown = filterBuilds(builds, showing);
  const filters = el(
    'div',
    { class: 'build-filters', role: 'group', 'aria-label': 'Show builds' },
    SHOW.map((which) => el('button', { class: 'filter-btn', type: 'button', 'aria-pressed': String(which === showing), onclick: () => onShow(which) }, which)),
  );
  return el(
    'div',
    { class: 'make-part' },
    filters,
    group('Builds', shown.filter((b) => b.group !== 'Room ideas'), blocks),
    group('Room ideas, for inside a house', shown.filter((b) => b.group === 'Room ideas'), blocks),
  );
}
