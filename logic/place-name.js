// Place names: what to call the screen at an address, for the big back button ("‹ Guides", "‹ Ocean", "‹ Cat").
// ctx: { book, guides, addons, builds, tricks }, the same as the pages get.
import { parseHash, pathOf } from './routes.js';
import { crumbLabel } from './trail.js';
import { findBuild } from './builds.js';
import { categoryById } from '../data/categories.js';
import { chapterById } from '../data/chapters.js';

// Screens with a fixed name. '' is Ask.
const NAMES = {
  '': 'Ask',
  make: 'Make',
  book: 'The book',
  guides: 'Guides',
  builds: 'Builds',
  tricks: 'Builder tricks',
  finish: 'Finish it',
  palettes: 'Palettes',
  surprise: 'Surprise me',
  mine: 'My builds',
  pixel: 'Pixel art',
  idea: 'Ideas',
  about: 'About',
  'grown-ups': 'Grown-ups',
};

export function placeName(hash, ctx = {}) {
  const route = parseHash(hash);
  const page = route.page === 'ask' ? '' : route.page;
  if (!route.id || page === 'mine' || page === 'pixel') return NAMES[page] || 'Back';
  if (page === 'book') return categoryById(route.id)?.name || NAMES.book;
  if (page === 'guides') return chapterById(route.id)?.name || NAMES.guides;
  if (page === 'build') return findBuild(ctx.builds?.builds || [], route.id)?.name || NAMES.builds;
  if (page === 'trick') return (ctx.tricks || []).find((t) => t.id === route.id)?.name || NAMES.tricks;
  if (!ctx.book) return 'Back';
  return crumbLabel(pathOf(route), undefined, ctx, route.kind) || 'Back';
}
