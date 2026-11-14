// Home: the four pages you swipe between, Make, Ask, The book and Guides, under one top bar with four squares.
// The app opens on Ask. Swiping (or tapping a square) slides to the next page and keeps the address up to date
// (#/make, #/, #/book, #/guides) without adding a step to Back.
import { el } from '../components/el.js';
import { swipePanels } from '../components/swipe.js';
import { pageDots } from '../components/page-dots.js';
import { shelfMenu } from '../components/shelf.js';
import { makePanel } from './make.js';
import { askPanel } from './ask.js';
import { bookPanel } from './book.js';
import { guidesPanel } from './guides.js';

const PAGES = [
  { page: 'make', name: 'Make', label: 'Make', build: makePanel },
  { page: 'ask', name: 'Ask', label: 'Bedrock guide', build: askPanel },
  { page: 'book', name: 'The book', label: 'The book', build: bookPanel },
  { page: 'guides', name: 'Guides', label: 'Guides', build: guidesPanel },
];

// Is this address one of the four home pages? (#/book is, #/book/tools is a page of the book.)
export const isHome = (route) => PAGES.some((p) => p.page === route.page) && !route.id;

const hashOf = (i) => (PAGES[i].page === 'ask' ? '#/' : `#/${PAGES[i].page}`);

export function homePage(ctx, route) {
  let at = Math.max(0, PAGES.findIndex((p) => p.page === route.page));
  const panels = PAGES.map((p) => p.build(ctx));
  const label = el('span', { class: 'bar-label' }, PAGES[at].label);
  const shelf = shelfMenu(ctx.book, [{ label: 'About this guide', href: '#/about', pic: 'book' }]);

  // Shows page i: the label, the squares, the tab title, and the address.
  const settle = (i) => {
    at = i;
    label.textContent = PAGES[i].label;
    dots.show(i);
    document.title = i === 1 ? 'Ask the guide' : `${PAGES[i].name} · Ask the guide`;
    if (location.hash !== hashOf(i) && !(i === 1 && !location.hash)) location.replace(hashOf(i));
  };
  const swipe = swipePanels({ panels: panels.map((p) => p.node), index: at, onChange: settle });
  const dots = pageDots(
    PAGES.map((p) => p.name),
    at,
    (i) => {
      swipe.moveTo(i);
      settle(i);
    },
  );

  const bar = el('header', { class: 'top-bar home-bar' }, label, el('div', { class: 'bar-right' }, dots.node, shelf.button));
  bar.append(shelf.panel);
  const strip = el('div', { class: 'grass', 'aria-hidden': 'true' });

  return {
    nodes: [bar, strip, swipe.node],
    title: PAGES[at].page === 'ask' ? 'Ask' : PAGES[at].name,
    focusNode: () => panels[at].node.querySelector('h1'),
    // Another home page in the address (Back, a square, a link): slide to it instead of building everything again.
    update(next) {
      if (!isHome(next)) return false;
      const i = PAGES.findIndex((p) => p.page === next.page);
      if (i !== at) {
        swipe.moveTo(i);
        settle(i);
      }
      return true;
    },
    cleanup() {
      panels.forEach((p) => p.cleanup?.());
      shelf.cleanup();
    },
  };
}
