// Fetch sources: downloads what the book is built from into .cache/ (not saved in git). Run once before npm run build.
// - Pixel Perfection CE pictures (CC BY-SA 4.0): only the folders we use, at the exact version the book was made from.
// - Mineclonia's picture files (CC BY-SA 4.0, based on Pixel Perfection) for newer things: pictures and license notes only.
// - minecraft-data (MIT): recipes, names, drops and mining tools. Nothing comes from Mojang's own files.
// Needs git and the internet.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = join(dirname(fileURLToPath(import.meta.url)), '..');
const cache = join(app, '.cache');

const REPOS = [
  {
    folder: 'ppce',
    url: 'https://github.com/Athemis/PixelPerfectionCE',
    commit: '28e38cab7c1f03f86364ef704f705bebcc13cb3d',
    paths: ['assets/minecraft/textures/block', 'assets/minecraft/textures/entity', 'assets/minecraft/textures/item'],
  },
  {
    folder: 'mineclonia',
    url: 'https://codeberg.org/mineclonia/mineclonia',
    commit: '994845e14398bcdf56e626cf6af3f4d19c58c9e9',
    // File patterns, not folders: its pictures sit in a "textures" folder inside each part of the game.
    patterns: ['/LEGAL.md', '/CREDITS.md', '/tools/Conversion_Table.csv', '/mods/**/textures/*.png', '/mods/**/README*'],
  },
];

const DATA = 'https://raw.githubusercontent.com/PrismarineJS/minecraft-data/master/data';
const DATA_FILES = [
  'dataPaths.json',
  'pc/26.1/recipes.json',
  'pc/26.1/items.json',
  'pc/26.1/blocks.json',
  'pc/26.1/entities.json',
  'pc/1.20/blockLoot.json',
  'pc/1.20/entityLoot.json',
  'bedrock/1.19.10/recipes.json',
  'bedrock/1.26.60/items.json',
];

const git = (...args) => execFileSync('git', args, { stdio: 'inherit' });

for (const repo of REPOS) {
  const dir = join(cache, repo.folder);
  if (!existsSync(dir)) {
    git('clone', '--filter=blob:none', '--no-checkout', repo.url, dir);
  }
  if (repo.patterns) git('-C', dir, 'sparse-checkout', 'set', '--no-cone', ...repo.patterns);
  else git('-C', dir, 'sparse-checkout', 'set', ...repo.paths);
  git('-C', dir, 'checkout', '--quiet', repo.commit);
  console.log(`${repo.folder}: ready at ${repo.commit.slice(0, 8)}`);
}

for (const file of DATA_FILES) {
  const res = await fetch(`${DATA}/${file}`);
  if (!res.ok) throw new Error(`Couldn't download ${file} (${res.status})`);
  const target = join(cache, 'minecraft-data', file);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, Buffer.from(await res.arrayBuffer()));
}
console.log(`minecraft-data: ${DATA_FILES.length} files`);
