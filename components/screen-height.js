// Screen height: the real height of the screen, kept in the CSS variable --app-height, so the app fills it exactly.
// 100vh is wrong on iPhones (it counts the part under Safari's bar) and Safari 12 has no dvh, so it comes from
// window.innerHeight, and is measured again when the screen turns or changes size. Turning an old iPad can report
// the old height at first, so it measures once more a moment later.
export function trackScreenHeight() {
  const set = () => document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
  set();
  window.addEventListener('resize', set);
  window.addEventListener('orientationchange', () => {
    set();
    setTimeout(() => {
      set();
      window.dispatchEvent(new Event('resize'));
    }, 400);
  });
}
