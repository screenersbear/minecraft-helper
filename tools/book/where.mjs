// Where to find things: the hand-written lines in where.json (written for Bedrock, checked against the Minecraft
// Wiki). The book keeps the lines without the wiki links:
//   where.mob[id] and where.item[id] = { say, guide?, build? }
//   places[id] = { name, pic, askedAs, say, guide? } for structures you can find (villages, strongholds...).
import { readFileSync } from 'node:fs';

// file: where.json. nameOf: the game's name for an id. mobs: the book's mobs. guideIds: the guides there are.
// Returns the lines, every item id the book needs a name and picture for, and anything that didn't fit.
export function buildWhere(file, nameOf, mobs, guideIds) {
  const source = JSON.parse(readFileSync(file, 'utf8'));
  const where = { mob: {}, item: {} };
  const places = {};
  const ids = new Set();
  const problems = [];
  const entry = (w) => {
    if (w.guide && !guideIds.has(w.guide)) problems.push(`no guide called ${w.guide}`);
    const out = { say: w.say };
    if (w.guide && guideIds.has(w.guide)) out.guide = w.guide;
    if (w.build) out.build = true;
    return out;
  };
  for (const [id, w] of Object.entries(source.mobs)) {
    if (mobs[id]) where.mob[id] = entry(w);
    else problems.push(`not a mob in the book: ${id}`);
  }
  for (const [id, w] of Object.entries(source.items)) {
    for (const each of [id, ...(w.also || [])]) {
      if (!nameOf(each)) {
        problems.push(`no such item: ${each}`);
        continue;
      }
      where.item[each] = entry(w);
      ids.add(each);
    }
  }
  for (const [id, p] of Object.entries(source.places)) {
    if (!nameOf(p.pic)) problems.push(`no picture called ${p.pic} for ${id}`);
    else ids.add(p.pic);
    places[id] = { name: p.name, pic: p.pic, askedAs: p.askedAs || [], ...entry(p) };
  }
  const noLine = Object.keys(mobs).filter((id) => !where.mob[id]);
  return { where, places, ids, problems, noLine };
}
