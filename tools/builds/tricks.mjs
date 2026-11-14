// Builder tricks: reads every trick in tricks/ (one JSON file each), checks it (see logic/tricks.js) and adds its
// blocks' looks to the block pictures. Returns the tricks in their order, for data/tricks.json, and any problems.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { checkTrick, lookId } from '../../logic/tricks.js';
import { addLook, hasLook } from './atlas.mjs';

export function readTricks(dir) {
  const problems = [];
  const tricks = [];
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    const trick = { id: file.replace(/\.json$/, ''), ...JSON.parse(readFileSync(join(dir, file), 'utf8')) };
    const found = checkTrick(trick, hasLook);
    if (found.length) {
      problems.push(...found.map((p) => `${file}: ${p}`));
      continue;
    }
    for (const entry of Object.values(trick.key)) addLook(lookId(entry));
    tricks.push(trick);
  }
  tricks.sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || a.name.localeCompare(b.name));
  return { tricks, problems };
}
