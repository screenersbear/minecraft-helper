// Load book: fetches the book, the guides, the nicknames, the builds and the add-on packs (the service worker keeps
// them for offline use), and builds the search list once. The builds also go in the book (book.builds), so asking
// "how do I build a treehouse" can find them.
import { buildSearchList } from '../logic/search-list.js';
import { loadAddons } from './load-addons.js';

const getJson = async (path) => {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Couldn't load ${path}`);
  return res.json();
};

export async function loadBook() {
  const [book, guides, nicknames, builds, addons] = await Promise.all([
    getJson('data/book.json'),
    getJson('data/guides.json'),
    getJson('data/nicknames.json'),
    getJson('data/builds.json'),
    loadAddons(),
  ]);
  book.builds = builds.builds;
  return { book, guides, addons, builds, list: buildSearchList(book, guides, nicknames) };
}
