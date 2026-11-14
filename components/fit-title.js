// Fit title: big headings shrink until they fit, so long names like "Netherite Upgrade Template"
// stay on the screen. Run it after the page is on screen. Headings opt in with data-fit="2" (at most 2 lines).
export function fitTitles(root) {
  for (const h of root.querySelectorAll('[data-fit]')) {
    const lines = Number(h.dataset.fit) || 2;
    h.style.fontSize = '';
    let size = parseFloat(getComputedStyle(h).fontSize);
    const min = 26;
    const tooBig = () => {
      const lineHeight = parseFloat(getComputedStyle(h).lineHeight) || size;
      return h.scrollWidth > h.clientWidth + 1 || h.offsetHeight > lineHeight * lines + 2;
    };
    while (tooBig() && size > min) {
      size -= 4;
      h.style.fontSize = `${size}px`;
    }
  }
}
