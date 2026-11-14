// Guides: one of the five home pages. Every guide as a row with its picture, its name and how many steps it has,
// in groups (Getting started, Finding things, Animals...). The groups come from each guide's "group".
import { el } from '../components/el.js';
import { itemPicture } from '../components/picture.js';
import { toHash } from '../logic/routes.js';

const GROUPS = ['Getting started', 'Finding things', 'Animals', 'Farming', 'Building', 'Redstone', 'Nether and End', 'Magic', 'Villagers', 'Danger'];

// [{ name, guides }] in the order of GROUPS, with any guide that has no group at the end under "More".
export function guideGroups(guides) {
  const named = GROUPS.map((name) => ({ name, guides: guides.filter((g) => g.group === name) }));
  const more = { name: 'More', guides: guides.filter((g) => !GROUPS.includes(g.group)) };
  return [...named, more].filter((group) => group.guides.length);
}

export function guidesPanel(ctx) {
  const row = (g) =>
    el(
      'a',
      { class: 'guide-row', href: toHash({ page: 'guide', id: g.id, step: 1, from: 'guides' }) },
      itemPicture(ctx.book, g.picture, 32),
      el('b', {}, g.title),
      el('span', {}, `${g.steps.length} steps`),
    );
  const group = ({ name, guides }) => el('section', { class: 'guide-group' }, el('h2', { class: 'small-label' }, name), el('div', { class: 'guide-rows' }, guides.map(row)));
  const node = el(
    'div',
    { class: 'page home-page' },
    el('h1', { class: 'home-title', tabindex: '-1' }, 'Guides'),
    el('p', { class: 'home-intro' }, 'Step by step. I read each step and wait for you.'),
    guideGroups(ctx.guides).map(group),
    el('p', { class: 'swipe-hint' }, 'Swipe for add-ons, or back to the book'),
  );
  return { node };
}
