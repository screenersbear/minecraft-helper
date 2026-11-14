// Load book: fetches the book, the guides, the nicknames, the builds, the add-on packs, the build challenges and
// the builder tricks (the service worker keeps them for offline use), and builds the search list once. The builds
// also go in the book (book.builds), so asking "how do I build a treehouse" can find them.
import { buildSearchList } from '../logic/search-list.js';
import { loadAddons } from './load-addons.js';

const getJson = async (path) => {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Couldn't load ${path}`);
  return res.json();
};

export async function loadBook() {
  const [book, guides, nicknames, builds, addons, challenges, tricks] = await Promise.all([
    getJson('data/book.json'),
    getJson('data/guides.json'),
    getJson('data/nicknames.json'),
    getJson('data/builds.json'),
    loadAddons(),
    getJson('data/challenges.json'),
    getJson('data/tricks.json'),
  ]);
  // Half-built starters (Finish it) are found from Make, not by asking.
  book.builds = builds.builds.filter((b) => b.group !== 'Finish it');
  return { book, guides, addons, builds, challenges, tricks, list: buildSearchList(book, guides, nicknames) };
}
