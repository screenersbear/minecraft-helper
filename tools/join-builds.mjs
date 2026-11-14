// Join builds: reads every build in builds/ (one JSON file each), the ready-made pixel art in builds/pixel-art.json
// and the builder tricks in tricks/, checks them (see logic/build-check.js and logic/tricks.js), cuts the block
// pictures they use into images/build-blocks.png (see builds/atlas.mjs), and writes data/builds.json and
// data/tricks.json for the app. Run by npm run build.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { checkBuild } from '../logic/build-check.js';
import { DIFFICULTIES, buildCounts } from '../logic/builds.js';
import { looks, addLook, hasLook, writeAtlas } from './builds/atlas.mjs';
import { readTricks } from './builds/tricks.mjs';

const app = fileURLToPath(new URL('..', import.meta.url));
const SOURCE = join(app, 'builds');
const book = JSON.parse(readFileSync(join(app, 'data/book.json'), 'utf8'));

const problems = [];
const known = (id) => (id === 'water' || book.items[id]?.pic >= 0) && hasLook(id);

const files = readdirSync(SOURCE).filter((f) => f.endsWith('.json') && f !== 'pixel-art.json');
const builds = [];
for (const file of files) {
  const build = { id: file.replace(/\.json$/, ''), ...JSON.parse(readFileSync(join(SOURCE, file), 'utf8')) };
  const found = checkBuild(build, known);
  if (found.length) {
    problems.push(...found.map((p) => `${file}: ${p}`));
    continue;
  }
  for (const entry of Object.values(build.key)) addLook(typeof entry === 'string' ? entry : entry.id);
  // The picture for the build in lists (like "Asked before"): the block it uses most.
  build.pic = buildCounts(build).find((c) => c.id !== 'water')?.id;
  builds.push(build);
}
const rank = (b) => DIFFICULTIES.indexOf(b.difficulty);
builds.sort((a, b) => (a.group === b.group ? 0 : a.group === 'Builds' ? -1 : 1) || rank(a) - rank(b) || a.name.localeCompare(b.name));

// Ready-made pixel art: square pictures in the pixel art colours, as { id, name, size, blocks, cells }.
const palette = new Set(book.palette.map((p) => p.id));
const pixel = Object.entries(JSON.parse(readFileSync(join(SOURCE, 'pixel-art.json'), 'utf8'))).map(([id, art]) => {
  const size = art.rows.length;
  if (art.rows.some((r) => r.length !== size)) problems.push(`pixel-art.json: ${id} isn't ${size} by ${size}`);
  const blocks = [...new Set(Object.values(art.key))];
  for (const b of blocks) if (!palette.has(b)) problems.push(`pixel-art.json: ${id} uses ${b}, which isn't a pixel art colour`);
  const cells = art.rows.join('').split('').map((ch) => blocks.indexOf(art.key[ch]));
  if (cells.includes(-1)) problems.push(`pixel-art.json: ${id} uses a letter that isn't in its key`);
  return { id, name: art.name, size, blocks, cells };
});

const trickList = readTricks(join(app, 'tricks'));
problems.push(...trickList.problems);

if (problems.length) {
  console.error(`Builds have problems:\n  ${problems.join('\n  ')}`);
  process.exit(1);
}

const pictures = writeAtlas();
writeFileSync(join(app, 'data/builds.json'), `${JSON.stringify({ blocks: looks, builds, pixel })}\n`);
writeFileSync(join(app, 'data/tricks.json'), `${JSON.stringify(trickList.tricks)}\n`);
console.log(`builds: ${builds.length} builds, ${trickList.tricks.length} tricks, ${pixel.length} pixel art pictures, ${pictures} block pictures`);
