// Breadcrumb: the way you dug to this answer, "The Bloop › Inside the Bloop › The boss fight", under the top bar.
// Every step but the last is a link back to it. The words come from logic/trail.js.
import { el } from './el.js';

// crumbs: [{ label, href }]; the last is the page on screen. Nothing for fewer than two steps.
export function trailNav(crumbs) {
  if (!crumbs || crumbs.length < 2) return null;
  const parts = crumbs.flatMap((c, i) => [
    i ? el('span', { class: 'trail-sep', 'aria-hidden': 'true' }, '›') : null,
    c.href ? el('a', { class: 'trail-link', href: c.href }, c.label) : el('span', { class: 'trail-here', 'aria-current': 'page' }, c.label),
  ]);
  return el('nav', { class: 'trail', 'aria-label': 'Where you are' }, parts.filter(Boolean));
}
