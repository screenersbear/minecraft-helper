// Load book: fetches the book, the guides and the nicknames (the service worker keeps them for offline use),
// and builds the search list once.
import { buildSearchList } from '../logic/search-list.js';

const getJson = async (path) => {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Couldn't load ${path}`);
  return res.json();
};

export async function loadBook() {
  const [book, guides, nicknames] = await Promise.all([
    getJson('data/book.json'),
    getJson('data/guides.json'),
    getJson('data/nicknames.json'),
  ]);
  return { book, guides, list: buildSearchList(book, guides, nicknames) };
}
