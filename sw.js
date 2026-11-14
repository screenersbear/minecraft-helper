// Service worker: keeps a copy of every file on the phone, so the guide opens without the internet.
// tools/stamp-sw.mjs fills in the cache name and the file list (npm run build). Don't edit those two lines by hand.
const CACHE_NAME = 'guide-526f306fd9';
const FILES = ["./","app.js","components/answer-head.js","components/buttons.js","components/el.js","components/feedback-area.js","components/fit-title.js","components/icons.js","components/pattern.js","components/picture.js","components/slots.js","components/step-picture.js","components/talk-button.js","components/thing-list.js","components/top-bar.js","data/book.json","data/guides.json","data/load-book.js","data/nicknames.json","data/questions-log.js","data/recent.js","data/store.js","fonts/atkinson-hyperlegible-latin-400-normal.woff2","fonts/atkinson-hyperlegible-latin-700-normal.woff2","fonts/pixelify-sans-latin-500-normal.woff2","fonts/pixelify-sans-latin-700-normal.woff2","images/grass.png","images/icon-180.png","images/icon-192.png","images/icon-512.png","images/icon-maskable-512.png","images/items.png","index.html","logic/commands.js","logic/find-answer.js","logic/plural.js","logic/routes.js","logic/say.js","logic/search-list.js","logic/spelling.js","logic/understand.js","logic/words.js","manifest.webmanifest","pages/about.js","pages/ask.js","pages/fact.js","pages/grown-ups.js","pages/guide.js","pages/mob.js","pages/not-found.js","pages/recipe.js","speech/guide-voice.js","speech/listen.js","speech/speak.js","styles/base.css","styles/buttons.css","styles/guide.css","styles/lists.css","styles/pages.css","styles/slots.css"];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(FILES))
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
