// Service worker: keeps a copy of every file on the phone, so the guide opens without the internet.
// tools/stamp-sw.mjs fills in the cache name and the file list (npm run build). Don't edit those two lines by hand.
const CACHE_NAME = 'guide-c791668c5a';
const FILES = ["./","app.js","components/answer-head.js","components/art-controls.js","components/art-thumb.js","components/block-art.js","components/block-picker.js","components/buttons.js","components/crop-box.js","components/el.js","components/feedback-area.js","components/fit-title.js","components/icons.js","components/ideas-list.js","components/page-dots.js","components/pattern.js","components/photo-button.js","components/picture.js","components/shelf.js","components/slots.js","components/step-picture.js","components/swipe.js","components/talk-button.js","components/thing-list.js","components/top-bar.js","data/art-photo.js","data/book.json","data/categories.js","data/guides.json","data/ideas.js","data/load-book.js","data/nicknames.json","data/photo.js","data/pixel-store.js","data/questions-log.js","data/recent.js","data/store.js","fonts/atkinson-hyperlegible-latin-400-normal.woff2","fonts/atkinson-hyperlegible-latin-700-normal.woff2","fonts/pixelify-sans-latin-500-normal.woff2","fonts/pixelify-sans-latin-700-normal.woff2","images/grass.png","images/icon-180.png","images/icon-192.png","images/icon-512.png","images/icon-maskable-512.png","images/items.png","index.html","logic/commands.js","logic/find-answer.js","logic/info.js","logic/pixel-background.js","logic/pixel-colours.js","logic/pixel-convert.js","logic/pixel-edits.js","logic/pixel-grid.js","logic/pixel-rows.js","logic/pixel-smooth.js","logic/pixel.js","logic/plural.js","logic/routes.js","logic/say-facts.js","logic/say.js","logic/search-list.js","logic/spelling.js","logic/understand.js","logic/words.js","manifest.webmanifest","pages/about.js","pages/ask.js","pages/book-page.js","pages/book.js","pages/fact.js","pages/grown-ups.js","pages/guide.js","pages/guides.js","pages/home.js","pages/idea.js","pages/info.js","pages/make.js","pages/mob.js","pages/not-found.js","pages/pixel-build.js","pages/pixel-crop.js","pages/pixel-result.js","pages/recipe.js","speech/guide-voice.js","speech/listen.js","speech/speak.js","styles/art-edit.css","styles/base.css","styles/buttons.css","styles/guide.css","styles/home.css","styles/lists.css","styles/make.css","styles/pages.css","styles/pixel.css","styles/shelf.css","styles/slots.css"];

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
