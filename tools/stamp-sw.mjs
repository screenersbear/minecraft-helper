// Stamp the service worker: lists every file the app needs offline in sw.js, and names the cache after a
// fingerprint of those files, so phones fetch a fresh copy whenever anything changes. Run by npm run build.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';

const app = fileURLToPath(new URL('..', import.meta.url));
const FOLDERS = ['components', 'data', 'logic', 'pages', 'speech', 'styles', 'fonts', 'images'];
const ROOT_FILES = ['index.html', 'app.js', 'manifest.webmanifest'];
const KEEP = /\.(js|json|css|png|woff2)$/;

function walk(folder) {
  return readdirSync(folder).flatMap((name) => {
    const path = join(folder, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const files = [
  ...ROOT_FILES.map((f) => join(app, f)),
  ...FOLDERS.flatMap((f) => walk(join(app, f)).filter((p) => KEEP.test(p))),
].sort();

const hash = createHash('sha256');
for (const f of files) hash.update(relative(app, f)).update(readFileSync(f));
const name = `guide-${hash.digest('hex').slice(0, 10)}`;
const list = ['./', ...files.map((f) => relative(app, f))];

const swPath = join(app, 'sw.js');
const sw = readFileSync(swPath, 'utf8')
  .replace(/^const CACHE_NAME = .*;$/m, `const CACHE_NAME = '${name}';`)
  .replace(/^const FILES = .*;$/m, `const FILES = ${JSON.stringify(list)};`);
writeFileSync(swPath, sw);
console.log(`sw.js: ${name}, ${list.length} files`);
