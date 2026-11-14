// Service worker: keeps a copy of every file on the phone, so the guide opens without the internet.
// tools/stamp-sw.mjs fills in the cache name and the file list (npm run build). Don't edit those two lines by hand.
const CACHE_NAME = 'guide-31297a23b6';
const FILES = ["./","app-old.js","app.js","components/answer-footer.js","components/answer-head.js","components/art-controls.js","components/art-thumb.js","components/ask-more.js","components/block-art.js","components/block-picker.js","components/block-swatches.js","components/build-picture.js","components/buttons.js","components/crop-box.js","components/dig-deeper.js","components/el.js","components/feedback-area.js","components/fit-title.js","components/follow-chips.js","components/icons.js","components/ideas-list.js","components/layer-view.js","components/linked-text.js","components/make-builds.js","components/make-pixel.js","components/page-dots.js","components/pattern.js","components/photo-button.js","components/picture.js","components/progress.js","components/question-log.js","components/remix-panel.js","components/shelf.js","components/size-picker.js","components/slots.js","components/step-picture.js","components/swipe.js","components/talk-button.js","components/thing-list.js","components/top-bar.js","components/trail.js","components/wide-screen.js","data/addons/index.json","data/addons/the-bloop/pack.json","data/art-photo.js","data/book.json","data/builds.json","data/categories.js","data/challenges.json","data/chapters.js","data/guides.json","data/ideas.js","data/last-thing.js","data/load-addons.js","data/load-book.js","data/my-builds.js","data/nicknames.json","data/palettes.js","data/photo.js","data/pixel-store.js","data/questions-log.js","data/recent.js","data/remixes.js","data/store.js","data/tricks.json","fonts/monocraft-400.woff2","fonts/monocraft-700.woff2","images/build-blocks.png","images/dirt.png","images/icon-180.png","images/icon-192.png","images/icon-512.png","images/icon-maskable-512.png","images/items.png","index.html","logic/addon-search.js","logic/addon.js","logic/build-check.js","logic/build-scene.js","logic/build-shapes.js","logic/builds.js","logic/challenges.js","logic/chapters.js","logic/chips.js","logic/commands.js","logic/fields.js","logic/find-answer.js","logic/follow-up.js","logic/info.js","logic/ingredient-link.js","logic/iso.js","logic/link-hash.js","logic/links.js","logic/pixel-background.js","logic/pixel-colours.js","logic/pixel-convert.js","logic/pixel-edits.js","logic/pixel-grid.js","logic/pixel-light.js","logic/pixel-rows.js","logic/pixel-shades.js","logic/pixel-size.js","logic/pixel-smooth.js","logic/pixel-subject.js","logic/pixel.js","logic/plural.js","logic/remix.js","logic/routes.js","logic/say-facts.js","logic/say-missing.js","logic/say.js","logic/search-list.js","logic/spelling.js","logic/target-name.js","logic/trail.js","logic/tricks.js","logic/understand.js","logic/where.js","logic/words.js","manifest.webmanifest","pages/about.js","pages/addon-answer.js","pages/ask.js","pages/book-page.js","pages/book.js","pages/build-cover.js","pages/build-layer.js","pages/builds.js","pages/chapter.js","pages/fact.js","pages/field.js","pages/finish.js","pages/grown-ups.js","pages/guide.js","pages/guides.js","pages/home.js","pages/idea.js","pages/info.js","pages/make-routes.js","pages/make.js","pages/mine-new.js","pages/mine-photo.js","pages/mine.js","pages/missing.js","pages/mob.js","pages/not-found.js","pages/palettes.js","pages/pixel-build.js","pages/pixel-crop.js","pages/pixel-home.js","pages/pixel-result.js","pages/recipe.js","pages/surprise.js","pages/trick.js","pages/tricks.js","speech/guide-voice.js","speech/listen.js","speech/speak.js","styles/addons.css","styles/art-edit.css","styles/base.css","styles/builds.css","styles/buttons.css","styles/follow.css","styles/guide.css","styles/home.css","styles/lists.css","styles/make.css","styles/mine.css","styles/old-safari.css","styles/pages.css","styles/pixel.css","styles/shelf.css","styles/slots.css","styles/surprise.css","styles/tricks.css","styles/wide.css"];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      // Fresh from the site, not the browser's own cache: GitHub Pages lets browsers keep files for 10 minutes,
      // so a copy made just after a release could otherwise keep some of the old files under the new name.
      .then((cache) => cache.addAll(FILES.map((file) => new Request(file, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

// A new version: throw away the old copies.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

// Saved copy first, the internet only for anything not saved.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(
    caches
      .match(request, { ignoreSearch: true })
      .then((hit) => hit || (request.mode === 'navigate' ? caches.match('./') : null))
      .then((hit) => hit || fetch(request)),
  );
});
