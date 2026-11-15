// Step screen: one step of a guide, a build, a builder trick or a pixel art, on one screen with no scrolling (see
// "Step screens fit the screen" in HANDOFF.md). Three bands: the top (step number and title), the middle, and the
// step buttons at the bottom. In the middle, the picture gets all the room the words don't need and is drawn to fill
// it. Words that don't fit are cut to whole lines, and they and any extras (like "Want to know more?") wait behind a
// More button. Sideways on a wide screen, the words sit beside the picture instead of under it
// (styles/step-screen.css).
import { el } from './el.js';
import { openMorePanel } from './more-panel.js';

// head: the top band's nodes. art: { node, fit(width, height) } or null; fit draws the picture to fill that box.
// words: [{ node, min }], the words with the picture, in order (text, or a list), and the fewest lines to keep of
// each when cutting (99: never cut it). extras: nodes shown only when there's room.
// more(): the nodes for the More panel, all in full. bottom: the band with the step buttons. minArt: the smallest
// the picture may get, in pixels, before words are cut. className: the page's own class.
export function stepScreen({ className = '', head, art = null, words = [], extras = [], more = () => [], bottom, minArt = 140 }) {
  const moreBtn = el('button', { class: 'block-btn small-btn tone-grey more-btn', type: 'button', onclick: () => openMorePanel(more()) }, 'More');
  moreBtn.hidden = true;
  const side = el('div', { class: 'step-side' }, words.map((w) => w.node), extras, moreBtn);
  const artBox = art ? el('div', { class: 'step-art' }, art.node) : null;
  const body = el('div', { class: 'step-body' }, artBox, side);
  const node = el('div', { class: `page step-screen ${className}` }, el('div', { class: 'step-top' }, head), body, bottom);

  // The height of one line: of text, or of one row of a list (its first item and the space around it).
  const lineOf = (w) => {
    const first = /^[OU]L$/.test(w.node.tagName) ? w.node.firstElementChild : null;
    if (!first) return parseFloat(getComputedStyle(w.node).lineHeight) || 22;
    const s = getComputedStyle(first);
    return first.offsetHeight + parseFloat(s.marginTop) + parseFloat(s.marginBottom);
  };
  const linesOf = (w) => w.lines || Math.round(w.node.scrollHeight / lineOf(w));
  // Cuts a word block to n lines (null: shows it all). Text gets "..." where it's cut.
  const cut = (w, n) => {
    w.lines = n;
    const s = w.node.style;
    const text = w.node.tagName === 'P';
    s.maxHeight = n ? `${n * lineOf(w)}px` : '';
    s.overflow = n ? 'hidden' : '';
    if (text) {
      s.display = n ? '-webkit-box' : '';
      s.webkitBoxOrient = n ? 'vertical' : '';
      s.webkitLineClamp = n ? String(n) : '';
    }
  };

  let drawn = '';
  const layout = () => {
    if (!node.isConnected) return;
    words.forEach((w) => cut(w, null));
    extras.forEach((x) => (x.style.display = ''));
    moreBtn.hidden = true;
    const sideways = getComputedStyle(body).flexDirection === 'row';
    const room = body.clientHeight - (sideways || !artBox ? 0 : minArt);
    const fits = () => side.scrollHeight <= room + 1;
    if (!fits() && extras.length) {
      extras.forEach((x) => (x.style.display = 'none'));
      moreBtn.hidden = false;
    }
    // Then cut the words, a line at a time from the longest, until they fit.
    for (let guard = 0; !fits() && guard < 100; guard++) {
      const longest = words.filter((w) => linesOf(w) > (w.min || 1)).sort((a, b) => linesOf(b) - linesOf(a))[0];
      if (!longest) break;
      moreBtn.hidden = false;
      cut(longest, linesOf(longest) - 1);
    }
    if (!artBox?.isConnected) return;
    // Too little room to show anything (the last step of a guide on a small phone): no picture, not a sliver.
    artBox.style.visibility = artBox.clientHeight < 40 ? 'hidden' : '';
    const size = `${artBox.clientWidth}x${artBox.clientHeight}`;
    if (size !== drawn) art.fit(artBox.clientWidth, artBox.clientHeight);
    drawn = size;
  };

  // Lay it out once it's on screen, again once the font has loaded, and whenever the screen or the bottom changes
  // ("Did that answer it?" growing, an Undo coming and going).
  let queued = false;
  const later = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      layout();
    });
  };
  const watch = window.MutationObserver ? new MutationObserver(later) : null;
  watch?.observe(bottom, { childList: true, subtree: true });
  window.addEventListener('resize', later);
  later();
  document.fonts?.ready?.then(later);
  const stop = () => {
    watch?.disconnect();
    window.removeEventListener('resize', later);
  };
  return { node, body, side, layout: later, stop };
}
