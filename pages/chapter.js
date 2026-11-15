// A chapter of the Guides page (#/guides/ocean): a big picture and the chapter's name, then its guides as big
// buttons with pictures. Topics from add-ons that fit the chapter come after, under "From your add-ons", each with a
// small tag naming its add-on, so kids don't need to know what came from where.
import { el } from '../components/el.js';
import { topBar } from '../components/top-bar.js';
import { itemPicture } from '../components/picture.js';
import { chapterById } from '../data/chapters.js';
import { chapterGuides, chapterTopics } from '../logic/chapters.js';
import { toHash } from '../logic/routes.js';
import { addonKey } from '../logic/addon.js';

const row = (book, pic, href, title, tag) =>
  el(
    'a',
    { class: 'menu-btn', href },
    itemPicture(book, pic, 32),
    el('span', { class: 'menu-words' }, el('b', {}, title), tag ? el('em', { class: 'addon-tag' }, tag) : null),
  );

export function chapterPage(ctx, route) {
  const chapter = chapterById(route.id);
  if (!chapter) return null;
  const from = `guides/${chapter.id}`;
  const guides = chapterGuides(ctx.guides, chapter);
  const topics = chapterTopics(ctx.addons, chapter);
  const guideRows = guides.map((g) => row(ctx.book, g.picture, toHash({ page: 'guide', id: g.id, step: 1, from }), g.title));
  const topicRows = topics.map((t) => row(ctx.book, t.pic, toHash({ page: 'addon', id: addonKey(t.pack, t.id), from }), t.title, `${t.pack.name} add-on`));
  const count = guides.length + topics.length;
  const section = (name, rows) => (rows.length ? [el('h2', { class: 'small-label' }, name), el('div', { class: 'menu-list' }, rows)] : []);

  return {
    title: chapter.name,
    nodes: [
      ...topBar({ back: '#/guides', right: 'Guides' }, ctx),
      el(
        'div',
        { class: 'page chapter-page' },
        el(
          'div',
          { class: 'chapter-head' },
          el('span', { class: 'slot big-slot' }, itemPicture(ctx.book, chapter.pic, 56)),
          el('div', {}, el('h1', { class: 'page-title', tabindex: '-1' }, chapter.name), el('p', { class: 'small-label' }, count === 1 ? '1 guide' : `${count} guides`)),
        ),
        topicRows.length ? section('In every game', guideRows) : el('div', { class: 'menu-list' }, guideRows),
        section('From your add-ons', topicRows),
      ),
    ],
  };
}
