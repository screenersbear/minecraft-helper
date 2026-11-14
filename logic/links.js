// Links in hand-written text (guide steps, where lines, facts): "It may leave you a [gift](mob:cat#gifts)" shows
// "gift" as a link to what cats' gifts are. A link is [words](type:id), or [words](type:id#field) for one fact
// about it. Types: item, mob, place, guide, biome, enchant, effect, topic. An item id can be a family ("@bed": any
// colour of bed). Read out loud, links are just words.

const LINK = /\[([^\]]+)\]\(([a-z]+):(@?[a-z0-9_-]+)(?:#([a-z]+))?\)/g;

// "Feed it [raw cod](item:cod)." -> [{ text: 'Feed it ' }, { text: 'raw cod', target: { type: 'item', id: 'cod' } }, { text: '.' }]
export function parseLinks(text) {
  const parts = [];
  let at = 0;
  for (const m of String(text || '').matchAll(LINK)) {
    if (m.index > at) parts.push({ text: text.slice(at, m.index) });
    parts.push({ text: m[1], target: { type: m[2], id: m[3] }, ...(m[4] ? { field: m[4] } : {}) });
    at = m.index + m[0].length;
  }
  if (at < String(text || '').length) parts.push({ text: text.slice(at) });
  return parts;
}

// The words without the links, for reading out and for matching.
export const plainText = (text) => String(text || '').replace(LINK, '$1');

// Just the links: [{ text, target, field? }].
export const linksIn = (text) => parseLinks(text).filter((p) => p.target);

// Text with something left over that looks like a broken link ("[gift](cat)"), for the build check.
export const brokenLink = (text) => /\[[^\]]*\]\(/.test(String(text || '').replace(LINK, ''));
