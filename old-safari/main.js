// Old Safari: the app for iPads stuck on iOS 12 (Safari 12). tools/build-old-safari.mjs turns this file, and the
// whole app it brings in, into one file, app-old.js, in JavaScript old Safari can read. index.html loads it instead
// of app.js when the browser is too old. First come the pieces old Safari is missing, then the app itself. (The CSS
// spaces things with margins, not flexbox gap, so it needs nothing extra.)
import './polyfills.js';
import './pointer-events.js';
import './dialog.js';
import '../app.js';
