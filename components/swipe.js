// Swipe: pages side by side. The row follows your finger and settles on one page with a calm slide, no bounce,
// and can't be pulled past the first or last page. Up and down still scrolls the page you're on.
// Swipes are left alone when they start on the talk button or a text box, or while the guide is listening.
import { el } from './el.js';

const IGNORE = '.talk-btn, input, textarea, select, [data-no-swipe]';
const SLIDE = 'transform 280ms cubic-bezier(0.25, 0.8, 0.3, 1)';
const START = 10; // pixels a finger moves before it counts as a swipe or a scroll

// panels: page nodes, in order. index: the one showing. onChange(i): a swipe settled on page i.
export function swipePanels({ panels, index, onChange }) {
  const track = el('div', { class: 'swipe-track' }, panels);
  const node = el('div', { class: 'swipe' }, track);
  const calm = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  let at = index;
  let start = null;
  let dragging = false;
  let justDragged = false;

  // Shows page `at`, moved by offset pixels while a finger drags it. Pages off screen can't be tapped or read.
  const place = (offset = 0, animate = false) => {
    track.style.transition = animate && !calm() ? SLIDE : 'none';
    track.style.transform = `translate3d(calc(${-at * 100}% + ${offset}px), 0, 0)`;
    panels.forEach((p, i) => {
      p.inert = i !== at;
      p.setAttribute('aria-hidden', String(i !== at));
    });
  };
  const moveTo = (i, animate = true) => {
    at = Math.max(0, Math.min(panels.length - 1, i));
    place(0, animate);
  };

  const width = () => node.clientWidth || 1;
  const down = (e) => {
    if (e.button > 0 || document.body.dataset.listening || e.target.closest?.(IGNORE)) return;
    start = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId };
    dragging = false;
  };
  const move = (e) => {
    if (!start || e.pointerId !== start.id) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (!dragging) {
      if (Math.abs(dy) > START && Math.abs(dy) > Math.abs(dx)) {
        start = null; // scrolling the page up or down
        return;
      }
      if (Math.abs(dx) < START) return;
      dragging = true;
      node.classList.add('dragging');
      node.setPointerCapture?.(e.pointerId);
    }
    const most = at === 0 ? 0 : width();
    const least = at === panels.length - 1 ? 0 : -width();
    place(Math.max(least, Math.min(most, dx)));
  };
  const up = (e) => {
    if (!start || e.pointerId !== start.id) return;
    const dx = e.clientX - start.x;
    const fast = Math.abs(dx) / Math.max(1, performance.now() - start.t) > 0.4;
    const was = dragging;
    start = null;
    dragging = false;
    node.classList.remove('dragging');
    if (!was) return;
    justDragged = true;
    setTimeout(() => (justDragged = false), 0);
    const before = at;
    let next = at;
    if (e.type !== 'pointercancel' && dx < 0 && (dx < -width() / 4 || fast)) next = at + 1;
    if (e.type !== 'pointercancel' && dx > 0 && (dx > width() / 4 || fast)) next = at - 1;
    moveTo(next);
    if (at !== before) onChange(at);
  };
  // A drag that ends on a link or button doesn't tap it.
  const click = (e) => {
    if (!justDragged) return;
    e.preventDefault();
    e.stopPropagation();
  };

  node.addEventListener('pointerdown', down);
  node.addEventListener('pointermove', move);
  node.addEventListener('pointerup', up);
  node.addEventListener('pointercancel', up);
  node.addEventListener('click', click, true);
  // With a mouse, dragging a link or picture would pick it up instead of swiping.
  node.addEventListener('dragstart', (e) => e.preventDefault());
  place();
  return { node, moveTo, current: () => at };
}
