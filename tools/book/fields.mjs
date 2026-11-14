// Facts in named slots: where.json (where to find every mob, the main items and places) and fields.json (what a
// mob eats, how to tame or breed it, its gifts, if it's dangerous, what an item is for). All written for Bedrock and
// checked against the Minecraft Wiki. The book keeps the facts without the wiki links:
//   fields[type][id][field] = { say, guide?, build? }   (type: mob or item; field: where, eats, tame, ...)
//   places[id] = { name, pic, askedAs, say, guide? }      for structures you can find (villages, strongholds...)
import { readFileSync } from 'node:fs';
import { linksIn } from '../../logic/links.js';

const FIELDS = ['where', 'eats', 'tame', 'breed', 'gifts', 'dangerous', 'uses'];

// whereFile, fieldsFile: the two files. nameOf: the game's name for an id. mobs: the book's mobs.
// guideIds: the guides there are. Returns the facts, every item id the book needs a name and picture for, and
// anything that didn't fit.
export function buildFields(whereFile, fieldsFile, nameOf, mobs, guideIds) {
  const where = JSON.parse(readFileSync(whereFile, 'utf8'));
  const more = JSON.parse(readFileSync(fieldsFile, 'utf8'));
  const fields = { mob: {}, item: {} };
  const places = {};
  const ids = new Set();
  const problems = [];
  // Items linked from a line need a name and picture in the book too.
  const linked = (say) => linksIn(say).forEach((l) => l.target.type === 'item' && (nameOf(l.target.id) ? ids.add(l.target.id) : problems.push(`no such item: ${l.target.id}`)));
  const entry = (w) => {
    if (w.guide && !guideIds.has(w.guide)) problems.push(`no guide called ${w.guide}`);
    linked(w.say);
    const out = { say: w.say };
    if (w.guide && guideIds.has(w.guide)) out.guide = w.guide;
    if (w.build) out.build = true;
    return out;
  };
  const known = (type, id) => (type === 'mob' ? Boolean(mobs[id]) : Boolean(nameOf(id)));
  const add = (type, id, field, w) => {
    if (!known(type, id)) return problems.push(`no such ${type}: ${id}`);
    if (!FIELDS.includes(field)) return problems.push(`${type} ${id}: no field called ${field}`);
    fields[type][id] = { ...fields[type][id], [field]: entry(w) };
    if (type === 'item') ids.add(id);
  };
  for (const [id, w] of Object.entries(where.mobs)) add('mob', id, 'where', w);
  for (const [id, w] of Object.entries(where.items)) for (const each of [id, ...(w.also || [])]) add('item', each, 'where', w);
  for (const [type, list] of [['mob', more.mobs], ['item', more.items]]) {
    for (const [id, facts] of Object.entries(list || {})) {
      for (const [field, w] of Object.entries(facts)) for (const each of [id, ...(w.also || [])]) add(type, each, field, w);
    }
  }
  for (const [id, p] of Object.entries(where.places)) {
    if (!nameOf(p.pic)) problems.push(`no picture called ${p.pic} for ${id}`);
    else ids.add(p.pic);
    places[id] = { name: p.name, pic: p.pic, askedAs: p.askedAs || [], ...entry(p) };
  }
  const noLine = Object.keys(mobs).filter((id) => !fields.mob[id]?.where);
  return { fields, places, ids, problems, noLine };
}
