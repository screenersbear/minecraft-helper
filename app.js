// App: opens the book, shows the screen named in the address (after #), and answers questions.
import { loadBook } from './data/load-book.js';
import { addRecent } from './data/recent.js';
import { logQuestion } from './data/questions-log.js';
import { findAnswer } from './logic/find-answer.js';
import { parseHash, hashForAnswer } from './logic/routes.js';
import { speak, stopSpeaking, unlockSpeech } from './speech/speak.js';
import { fitTitles } from './components/fit-title.js';
import { el } from './components/el.js';
import { homePage, isHome } from './pages/home.js';
import { bookPage } from './pages/book-page.js';
import { pixelCropPage } from './pages/pixel-crop.js';
import { pixelResultPage } from './pages/pixel-result.js';
import { pixelBuildPage } from './pages/pixel-build.js';
import { ideaPage } from './pages/idea.js';
import { recipePage } from './pages/recipe.js';
import { guidePage } from './pages/guide.js';
import { mobPage } from './pages/mob.js';
import { factPage } from './pages/fact.js';
import { notFoundPage } from './pages/not-found.js';
import { grownUpsPage } from './pages/grown-ups.js';
import { aboutPage } from './pages/about.js';
import { infoPage } from './pages/info.js';
import { isInfo, infoOf } from './logic/info.js';

const PAGES = {
  recipe: recipePage, guide: guidePage, mob: mobPage, fact: factPage, none: notFoundPage, 'grown-ups': grownUpsPage, about: aboutPage,
  biome: infoPage('biome'), enchant: infoPage('enchant'), effect: infoPage('effect'), topic: infoPage('topic'), idea: ideaPage,
};
const root = document.getElementById('app');
let view = null;

// The picture shown next to a question under "Asked before".
function pictureFor(answer, book, guides) {
  if (answer.type === 'none') return null;
  if (answer.target.type === 'mob') return { kind: 'mob', id: answer.target.id };
  if (isInfo(answer.target.type)) return { kind: 'item', id: infoOf(book, answer.target)?.pic };
  if (answer.target.type === 'guide') return { kind: 'item', id: guides.find((g) => g.id === answer.target.id)?.picture };
  return { kind: 'item', id: answer.target.id };
}

// Which screen an address shows. The four home pages (Make, Ask, The book, Guides) are one screen you swipe across.
function pageFor(route) {
  if (isHome(route)) return homePage;
  if (route.page === 'book') return bookPage;
  // Pixel art: #/pixel/crop, then #/pixel/<id> for the result and #/pixel/<id>/<row> to build it.
  if (route.page === 'pixel') return route.id === 'crop' ? pixelCropPage : route.step ? pixelBuildPage : pixelResultPage;
  return PAGES[route.page];
}

function show(ctx) {
  const route = parseHash(location.hash);
  // Swiping between home pages changes the address, but the screen is already showing.
  if (view?.update?.(route)) return;
  view?.cleanup?.();
  stopSpeaking();
  const page = pageFor(route);
  view = page ? page(ctx, route) : null;
  if (!view) {
    // An old or broken address: go back to Ask.
    if (location.hash && location.hash !== '#/') return location.replace('#/');
    view = homePage(ctx, route);
  }
  root.replaceChildren(...view.nodes.filter(Boolean));
  document.title = view.title && view.title !== 'Ask' ? `${view.title} · Ask the guide` : 'Ask the guide';
  window.scrollTo(0, 0);
  fitTitles(root);
  (view.focusNode?.() || root.querySelector('h1'))?.focus({ preventScroll: true });
  if (view.say) speak(view.say);
}

function start({ book, guides, list }) {
  const ctx = {
    book,
    guides,
    list,
    ask(question) {
      const q = String(question || '').trim();
      if (!q) return;
      const answer = findAnswer(q, list, book, guides);
      addRecent({ q, pic: pictureFor(answer, book, guides) });
      if (answer.type === 'none') logQuestion(q, 'not-in-book');
      ctx.go(hashForAnswer(answer, q));
    },
    go(hash, { replace = false } = {}) {
      if (hash === location.hash) return show(ctx);
      if (replace) location.replace(hash);
      else location.hash = hash;
    },
    refresh: () => show(ctx),
    say: (text) => speak(text),
  };
  window.addEventListener('hashchange', () => show(ctx));
  show(ctx);
}

// iPhone only lets a page talk after a tap. The first tap anywhere (except while listening) allows it.
const allowSpeech = () => {
  if (!document.body.dataset.listening) unlockSpeech();
};
document.addEventListener('touchend', allowSpeech, true);
document.addEventListener('click', allowSpeech, true);

loadBook()
  .then(start)
  .catch(() => {
    root.replaceChildren(
      el('div', { class: 'page' }, el('p', { class: 'say' }, "Couldn't open the book. Check the internet, then try again."), el('button', { class: 'block-btn notch tone-mango', type: 'button', onclick: () => location.reload() }, 'Try again')),
    );
  });

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
