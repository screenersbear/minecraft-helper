// Breadcrumb words: the way you dug to an answer with "Want to know more?", from the trail in the address
// (see routes.js). Regular answers: "Cat › Taming › Raw Cod". Add-on answers always start with the add-on's name:
// "The Bloop › Inside the Bloop › The boss fight".
import { pathOf, crumbHash, parseHash } from './routes.js';
import { parseTarget, parseFieldKey } from './where.js';
import { targetName } from './target-name.js';
import { isInfo } from './info.js';
import { fieldForKind } from './fields.js';
import { addonOf, askFor } from './addon.js';
import { addonHome } from './chapters.js';

// A fact's short name in the trail, when the step before is about the same thing.
const SHORT = { where: 'Where', eats: 'Food', tame: 'Taming', breed: 'Breeding', gifts: 'Gifts', dangerous: 'Danger', uses: 'Uses' };

// What one step is about: { target, field } (field only for a fact), or null. kind: the kind of question, which
// says which fact a "not yet" page is about.
function thingOf(path, kind = '') {
  const { page, id } = parseHash(`#/${path}`);
  if (!id) return null;
  if (page === 'recipe' || page === 'fact') return { target: { type: 'item', id } };
  if (page === 'mob' || page === 'guide' || isInfo(page)) return { target: { type: page, id } };
  if (page === 'missing') {
    const target = parseTarget(id);
    return { target, field: (kind && fieldForKind(kind, target)) || undefined };
  }
  if (page === 'where') return { target: parseTarget(id), field: 'where' };
  if (page === 'field') return parseFieldKey(id);
  return null;
}

const sameThing = (a, b) => Boolean(a?.target && b?.target) && a.target.type === b.target.type && a.target.id === b.target.id;

// The words for one step. before: the step before it, so a fact about the same thing says just "Taming".
// kind: the kind of question, for the page on screen.
export function crumbLabel(path, before, { book, guides, addons }, kind = '') {
  const { page, id } = parseHash(`#/${path}`);
  if (page === 'addon') {
    const found = addonOf(addons, id);
    if (!found) return id;
    return found.pack.answers[found.id]?.title || askFor(found.pack, found.id) || found.pack.name;
  }
  const here = thingOf(path, kind);
  if (!here?.target) return id || page;
  const name = targetName(book, guides, here.target);
  if (!here.field) return name;
  return sameThing(here, before && thingOf(before)) ? SHORT[here.field] : `${name}: ${SHORT[here.field]}`;
}

// The breadcrumb for the page at route: [{ label, href }], the last one (the page on screen) with no link. Empty for a
// regular answer that wasn't reached by digging deeper.
export function crumbsFor(route, ctx) {
  const paths = [...route.trail, pathOf(route)];
  const last = paths.length - 1;
  const crumbs = paths.map((path, i) => ({ label: crumbLabel(path, paths[i - 1], ctx, i === last ? route.kind : ''), href: i < last ? crumbHash(route, i) : '' }));
  if (route.page !== 'addon') return route.trail.length ? crumbs : [];
  const found = addonOf(ctx.addons, route.id);
  if (!found) return [];
  // A question the add-on has nothing for: just its name, with nothing after it.
  return [{ label: found.pack.name, href: addonHome(found.pack) }, ...(found.id ? crumbs : [])];
}
