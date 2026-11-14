// Chapters: which guides and add-on topics go in each chapter of the Guides page.
import { CHAPTERS, chapterNamed } from '../data/chapters.js';

// The guides in a chapter, in the order they're in. A guide with no chapter, or one that isn't on the list, goes in
// Getting started so it never goes missing.
export function chapterGuides(guides, chapter) {
  const first = CHAPTERS[0];
  return (guides || []).filter((g) => (chapterNamed(g.group) || first).id === chapter.id);
}

// The add-on topics in a chapter: [{ pack, id, title, pic }], from every add-on that puts its topics there.
export function chapterTopics(packs, chapter) {
  const out = [];
  for (const pack of packs || []) {
    if (pack.chapter !== chapter.id) continue;
    for (const id of pack.topics || []) {
      const answer = pack.answers?.[id];
      if (answer) out.push({ pack, id, title: answer.title, pic: pack.pics?.[id] || chapter.pic });
    }
  }
  return out;
}

// Where an add-on's answers go back to: its chapter of the Guides page, or the Guides page.
export const addonHome = (pack) => (pack?.chapter ? `#/guides/${pack.chapter}` : '#/guides');
