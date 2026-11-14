// App: opens the book, shows the screen named in the address (after #), and answers questions.
import { loadBook } from './data/load-book.js';
import { addRecent } from './data/recent.js';
import { logQuestion, NOT_IN_BOOK } from './data/questions-log.js';
import { rememberThing, lastThing } from './data/last-thing.js';
import { findAnswer, buildNamed } from './logic/find-answer.js';
import { parseHash, hashForAnswer } from './logic/routes.js';
import { withLastThing, describeLast, thingOfRoute, followUp } from './logic/follow-up.js';
import { missingLabel } from './logic/say-missing.js';
import { targetName } from './logic/target-name.js';
import { speak, stopSpeaking, unlockSpeech } from './speech/speak.js';
import { fitTitles } from './components/fit-title.js';
import { el } from './components/el.js';
import { homePage, isHome } from './pages/home.js';
import { bookPage } from './pages/book-page.js';
import { pixelCropPage } from './pages/pixel-crop.js';
import { pixelResultPage } from './pages/pixel-result.js';
import { pixelBuildPage } from './pages/pixel-build.js';
import { buildCoverPage } from './pages/build-cover.js';
import { buildLayerPage } from './pages/build-layer.js';
import { ideaPage } from './pages/idea.js';
import { recipePage } from './pages/recipe.js';
import { guidePage } from './pages/guide.js';
import { mobPage } from './pages/mob.js';
import { factPage } from './pages/fact.js';
import { notFoundPage } from './pages/not-found.js';
import { grownUpsPage } from './pages/grown-ups.js';
import { aboutPage } from './pages/about.js';
import { infoPage } from './pages/info.js';
import { fieldPage } from './pages/field.js';
import { missingPage } from './pages/missing.js';
import { addonAnswerPage } from './pages/addon-answer.js';
import { chapterPage } from './pages/chapter.js';
import { trailNav } from './components/trail.js';
import { crumbsFor } from './logic/trail.js';
import { isInfo, infoOf } from './logic/info.js';

const PAGES = {
  recipe: recipePage, guide: guidePage, mob: mobPage, fact: factPage, none: notFoundPage, 'grown-ups': grownUpsPage, about: aboutPage,
  biome: infoPage('biome'), enchant: infoPage('enchant'), effect: infoPage('effect'), topic: infoPage('topic'), idea: ideaPage,
  where: fieldPage, field: fieldPage, missing: missingPage, addon: addonAnswerPage,
};
const root = document.getElementById('app');
let view = null;

// The picture shown next to a question under "Asked before".
function pictureFor(answer, book, guides) {
  if (answer.type === 'none') return null;
  if (answer.target.type === 'mob') return { kind: 'mob', id: answer.target.id };
  if (answer.target.type === 'place') return { kind: 'item', id: book.places?.[answer.target.id]?.pic };
  if (isInfo(answer.target.type)) return { kind: 'item', id: infoOf(book, answer.target)?.pic };
  if (answer.target.type === 'guide') return { kind: 'item', id: guides.find((g) => g.id === answer.target.id)?.picture };
  if (answer.target.type === 'build') return { kind: 'item', id: book.builds?.find((b) => b.id === answer.target.id)?.pic };
  return { kind: 'item', id: answer.target.id };
}

// Which screen an address shows. The four home pages (Ask, Make, The book, Guides) are one screen you swipe across.
function pageFor(route) {
  if (isHome(route)) return homePage;
  if (route.page === 'book') return bookPage;
  // A chapter of the Guides page: #/guides/ocean.
  if (route.page === 'guides') return chapterPage;
  // Pixel art: #/pixel/crop, then #/pixel/<id> for the result and #/pixel/<id>/<row> to build it.
  if (route.page === 'pixel') return route.id === 'crop' ? pixelCropPage : route.step ? pixelBuildPage : pixelResultPage;
  // Builds: #/build/<id> for the cover, #/build/<id>/<layer> to build it layer by layer.
  if (route.page === 'build') return route.step ? buildLayerPage : buildCoverPage;
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
  // The breadcrumb (The Bloop › Inside the Bloop › The boss fight) goes under the top bar.
  const nodes = view.nodes.filter(Boolean);
  const trail = trailNav(crumbsFor(route, ctx));
  if (trail) nodes.splice(1, 0, trail);
  root.replaceChildren(...nodes);
  document.title = view.title && view.title !== 'Ask' ? `${view.title} · Ask the guide` : 'Ask the guide';
  window.scrollTo(0, 0);
  fitTitles(root);
  (view.focusNode?.() || root.querySelector('h1'))?.focus({ preventScroll: true });
  // Topic memory: what this answer is about and what it mentions, for a follow-up like "what gifts?".
  const thing = thingOfRoute(route);
  if (thing) rememberThing({ ...thing, ...view.memory });
  readOut(view.say);
}

// Reads the answer out, then tells the page it has finished ('answer-spoken'), so "Did that answer it?" can show.
// If the phone never says it's done (no voice yet on iPhone), it shows after about as long as reading would take.
let showing = 0;
function readOut(text) {
  const mine = ++showing;
  const done = () => mine === showing && document.dispatchEvent(new Event('answer-spoken'));
  if (!text) return done();
  speak(text, done);
  setTimeout(done, Math.min(25000, 3000 + text.split(/\s+/).length * 600));
}

function start({ book, guides, addons, builds, list }) {
  const ctx = {
    book,
    guides,
    addons,
    builds,
    list,
    ask(question) {
      const q = String(question || '').trim();
      if (!q) return;
      // A follow-up that names nothing ("what gifts?", "how do I get it?") is answered from topic memory. One
      // that names an ingredient of the last recipe ("what about the sugar?") is matched with it put in.
      const memory = lastThing();
      const alone = findAnswer(q, list, book, guides);
      const follow = alone.type === 'none' ? followUp(q, memory, book, guides, list) : null;
      // One that says a build's name ("how do I make a present") is about that build, not the last answer.
      const matched = follow || buildNamed(q, list) ? q : withLastThing(q, describeLast(memory, book, guides));
      const answer = follow || findAnswer(matched, list, book, guides);
      addRecent({ q, pic: pictureFor(answer, book, guides) });
      if (answer.type === 'none') logQuestion({ q, answer: NOT_IN_BOOK, reason: 'not-in-book' });
      if (answer.type === 'missing') {
        const missing = missingLabel(targetName(book, guides, answer.target), q, answer.kind);
        logQuestion({ q, answer: missing, reason: 'missing', missing });
      }
      ctx.go(hashForAnswer(answer, q, follow || matched !== q ? answer.kind : undefined));
    },
    go(hash, { replace = false } = {}) {
      if (hash === location.hash) return show(ctx);
      if (replace) location.replace(hash);
      else location.hash = hash;
    },
    refresh: () => show(ctx),
    say: (text, onDone) => speak(text, onDone),
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
