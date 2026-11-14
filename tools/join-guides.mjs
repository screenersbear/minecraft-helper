// Joins the hand-written guides (guides/*.json, one file each) into data/guides.json for the app, and checks them:
// every picture must be in the book, steps stay short, and no em dashes. Run after editing a guide: npm run build:guides
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = join(dirname(fileURLToPath(import.meta.url)), '..');
const book = JSON.parse(readFileSync(join(app, 'data/book.json'), 'utf8'));
const problems = [];
const warn = (guide, msg) => problems.push(`${guide}: ${msg}`);

const guides = [];
for (const file of readdirSync(join(app, 'guides')).filter((f) => f.endsWith('.json')).sort()) {
  const g = JSON.parse(readFileSync(join(app, 'guides', file), 'utf8'));
  const need = ['id', 'title', 'picture', 'askedAs', 'wiki', 'steps'];
  for (const k of need) if (!g[k]) warn(file, `missing "${k}"`);
  if (!book.items[g.picture]) warn(file, `picture "${g.picture}" isn't in the book`);
  g.steps.forEach((s, i) => {
    const where = `step ${i + 1}`;
    if (!s.title || !s.say) warn(file, `${where} needs a title and say`);
    const words = s.say.split(/\s+/).length;
    const sentences = s.say.split(/[.!?](\s|$)/).filter((x) => x && x.trim()).length;
    if (words > 35) warn(file, `${where} is ${words} words (keep it under about 30)`);
    if (sentences > 3) warn(file, `${where} has ${sentences} sentences (keep it to 3 short ones at most)`);
    if (/[—–]/.test(s.say + s.title)) warn(file, `${where} has a long dash`);
    if (s.item && !book.items[s.item]) warn(file, `${where} picture "${s.item}" isn't in the book`);
    for (const [k, v] of Object.entries(s.key || {})) if (!book.items[v]) warn(file, `${where} pattern "${k}" = "${v}" isn't in the book`);
    if (s.pattern && new Set(s.pattern.map((r) => r.length)).size > 1) warn(file, `${where} pattern rows aren't the same length`);
  });
  guides.push({ id: g.id, title: g.title, picture: g.picture, askedAs: g.askedAs, steps: g.steps });
}

writeFileSync(join(app, 'data/guides.json'), JSON.stringify(guides));
console.log(`guides: ${guides.length} joined into data/guides.json`);
if (problems.length) console.log(`to check:\n  ${problems.join('\n  ')}`);
