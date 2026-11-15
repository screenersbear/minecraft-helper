// Edge swipe: sliding a finger in from the left edge of the screen goes back, the same as tapping the big back
// button at the top. An arrow follows the finger so you can see it working; it turns yellow once letting go will go
// back. Only on screens with a back button (the four main pages swipe between each other instead). It uses touch
// events, which the old iPad has too. If the browser does its own back swipe (Safari, outside the Home Screen app),
// the address changes first and this one does nothing.
import { el } from './el.js';

const EDGE = 20; // how near the left edge a finger has to start, in pixels (the page's side margin)
const FAR = 80; // how far it has to slide to the right to count

// findBack(): the back button on the screen now, or nothing.
export function edgeSwipe(findBack) {
  const arrow = el('div', { class: 'edge-arrow', 'aria-hidden': 'true' }, '‹');
  document.body.append(arrow);
  let start = null;

  const reset = () => {
    start = null;
    arrow.classList.remove('is-showing', 'is-ready');
    arrow.style.transform = '';
  };
  const moved = (touch) => ({ dx: touch.clientX - start.x, dy: touch.clientY - start.y });

  document.addEventListener(
    'touchstart',
    (e) => {
      const touch = e.touches[0];
      if (e.touches.length !== 1 || touch.clientX > EDGE || !findBack()) return reset();
      start = { x: touch.clientX, y: touch.clientY, hash: location.hash };
    },
    { passive: true },
  );
  document.addEventListener(
    'touchmove',
    (e) => {
      if (!start) return;
      const { dx, dy } = moved(e.touches[0]);
      // Going up or down more than across: it's a scroll, not a swipe.
      if (Math.abs(dy) > Math.max(30, dx)) return reset();
      arrow.classList.add('is-showing');
      arrow.classList.toggle('is-ready', dx >= FAR);
      arrow.style.transform = `translateX(${Math.max(0, Math.min(dx, FAR + 24))}px)`;
    },
    { passive: true },
  );
  document.addEventListener('touchend', (e) => {
    if (!start) return;
    const { dx, dy } = moved(e.changedTouches[0]);
    const sameScreen = location.hash === start.hash;
    reset();
    const back = findBack();
    if (sameScreen && back && dx >= FAR && Math.abs(dy) < dx) back.click();
  });
  document.addEventListener('touchcancel', reset);
}
