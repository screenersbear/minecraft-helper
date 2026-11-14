// Checks a build the way you'd find out by building it: every layer has the same size, every letter has a block,
// the build fits its difficulty, and nothing floats (each block sits on one below, or touches a block that does).
// Water holds nothing up. Returns a list of problems, empty when the build is fine.
import { sizeOf, blockAt, allBlocks, MOST, DIFFICULTIES } from './builds.js';

const NEAR = [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, 1, 0]];

// "layer 2, row 3, block 4" for each block with nothing under it.
export function floating(build) {
  const held = new Set();
  const key = (x, y, z) => `${x},${y},${z}`;
  const holds = (x, y, z) => {
    const b = blockAt(build, x, y, z);
    return !!b && b.id !== 'water';
  };
  const queue = [];
  for (const [x, y, z] of allBlocks(build)) {
    if (y === 0 || holds(x, y - 1, z)) {
      held.add(key(x, y, z));
      queue.push([x, y, z]);
    }
  }
  while (queue.length) {
    const [x, y, z] = queue.pop();
    if (!holds(x, y, z)) continue;
    for (const [dx, dy, dz] of NEAR) {
      const n = [x + dx, y + dy, z + dz];
      if (blockAt(build, ...n) && !held.has(key(...n))) {
        held.add(key(...n));
        queue.push(n);
      }
    }
  }
  return allBlocks(build)
    .filter(([x, y, z]) => !held.has(key(x, y, z)))
    .map(([x, y, z]) => `layer ${y + 1}, row ${z + 1}, block ${x + 1}`);
}

// known(id): whether the app has this block (a name and a picture).
export function checkBuild(build, known = () => true) {
  const problems = [];
  const { W, D } = sizeOf(build);
  if (!build.name || !build.about) problems.push('needs a name and an about line');
  if (!DIFFICULTIES.includes(build.difficulty)) problems.push(`difficulty must be one of ${DIFFICULTIES.join(', ')}`);
  else if (W > MOST[build.difficulty] || D > MOST[build.difficulty]) problems.push(`${W} by ${D} is too big for ${build.difficulty}`);
  build.layers.forEach((layer, i) => {
    if (!layer.name) problems.push(`layer ${i + 1} needs a name`);
    if (layer.rows.length !== D || layer.rows.some((r) => r.length !== W)) problems.push(`layer ${i + 1} isn't ${W} by ${D}`);
    for (const ch of layer.rows.join('')) if (ch !== '.' && !build.key[ch]) problems.push(`layer ${i + 1} uses "${ch}", which isn't in the key`);
  });
  for (const [ch, entry] of Object.entries(build.key)) {
    const id = typeof entry === 'string' ? entry : entry.id;
    if (!known(id)) problems.push(`"${ch}" is ${id}, which the app doesn't know`);
  }
  if (!problems.length) for (const where of floating(build).slice(0, 3)) problems.push(`floating block at ${where}`);
  return problems;
}
