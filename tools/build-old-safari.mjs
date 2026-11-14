// Build old Safari: makes app-old.js, the whole app as one file in JavaScript that Safari 12 (iPads stuck on iOS
// 12) can read, with the missing pieces from old-safari/ added. index.html loads it on old browsers. Run by npm run
// build, after anything in the app changes.
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const app = fileURLToPath(new URL('..', import.meta.url));
const result = await build({
  entryPoints: [join(app, 'old-safari/main.js')],
  outfile: join(app, 'app-old.js'),
  bundle: true,
  format: 'iife',
  target: 'safari12',
  // Safari 12 can read destructuring ({ a, b } = thing); esbuild is extra careful about a rare bug in it.
  supported: { destructuring: true },
  minify: true,
  legalComments: 'none',
  logLevel: 'warning',
  metafile: true,
});
const size = Object.values(result.metafile.outputs)[0].bytes;
console.log(`app-old.js: ${Math.round(size / 1024)} KB for Safari 12`);
