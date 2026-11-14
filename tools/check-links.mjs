// The link check: nothing gets mentioned without an answer behind it. Reads every guide step (guides/*.json),
// where line (tools/book/where.json) and fact (tools/book/fields.json), and fails if a thing is named without a
// link, or a link leads nowhere. Runs in `npm run build` after the book and guides are made.
// `node tools/check-links.mjs --fix` puts the missing links in for you (check them after).
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { linksIn, brokenLink } from '../logic/links.js';
import { parseTarget } from '../logic/where.js';
import { mentionWords, unlinked, badLink, addLinks } from './book/mentions.mjs';

const app = join(dirname(fileURLToPath(import.meta.url)), '..');
const fix = process.argv.includes('--fix');
const read = (p) => readFileSync(join(app, p), 'utf8');
const book = JSON.parse(read('data/book.json'));
const guides = JSON.parse(read('data/guides.json'));
const words = mentionWords(book);
const problems = [];

// Each file's texts: { file, where, say, owners }.
function texts() {
  const out = [];
  const where = JSON.parse(read('tools/book/where.json'));
  for (const [type, list] of [['mob', where.mobs], ['item', where.items], ['place', where.places]]) {
    for (const [id, w] of Object.entries(list)) out.push({ file: 'tools/book/where.json', where: `${type} ${id}`, say: w.say, owners: [id, ...(w.also || [])].map((x) => ({ type, id: x })) });
  }
  const fields = JSON.parse(read('tools/book/fields.json'));
  for (const [type, list] of [['mob', fields.mobs], ['item', fields.items]]) {
    for (const [id, facts] of Object.entries(list)) {
      for (const [field, w] of Object.entries(facts)) out.push({ file: 'tools/book/fields.json', where: `${type} ${id} ${field}`, say: w.say, field, owners: [id, ...(w.also || [])].map((x) => ({ type, id: x })) });
    }
  }
  for (const f of readdirSync(join(app, 'guides')).filter((x) => x.endsWith('.json')).sort()) {
    const g = JSON.parse(read(`guides/${f}`));
    const owners = [{ type: 'guide', id: g.id }, parseTarget(g.topic)].filter(Boolean);
    g.steps.forEach((s, i) => out.push({ file: `guides/${f}`, where: `step ${i + 1}`, say: s.say, owners }));
  }
  return out;
}

const changes = new Map(); // file -> [[old, new]]
for (const t of texts()) {
  if (brokenLink(t.say)) problems.push(`${t.file} ${t.where}: a link is written wrong`);
  for (const link of linksIn(t.say)) {
    const bad = badLink(link, book, guides);
    if (bad) problems.push(`${t.file} ${t.where}: "${link.text}" leads nowhere (${bad})`);
  }
  const found = unlinked(t.say, words, t.owners, t.field);
  if (!found.length) continue;
  if (fix) {
    const fixed = addLinks(t.say, found);
    if (!changes.has(t.file)) changes.set(t.file, []);
    changes.get(t.file).push([t.say, fixed]);
  } else {
    problems.push(`${t.file} ${t.where}: no link for ${found.map((f) => `"${f.text}" (${f.target.type}:${f.target.id}${f.target.field ? `#${f.target.field}` : ''})`).join(', ')}`);
  }
}

if (fix) {
  for (const [file, list] of changes) {
    let text = read(file);
    for (const [before, after] of list) text = text.split(JSON.stringify(before)).join(JSON.stringify(after));
    writeFileSync(join(app, file), text);
  }
  const count = [...changes.values()].reduce((n, l) => n + l.length, 0);
  console.log(`links: added links to ${count} lines in ${changes.size} files. Check them, then build again.`);
}
if (problems.length) {
  console.log(`links: ${problems.length} problems\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
if (!fix) console.log('links: every mention has a link, and every link has an answer');
