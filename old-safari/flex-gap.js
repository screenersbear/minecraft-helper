// Old Safari ignores "gap" in flexbox (it only works in grids there), so rows of buttons and lists would touch.
// This puts the gaps back as margins: whenever the screen changes, each flex box with a gap gives its children a
// margin of that size, unless they already have one.

function supportsFlexGap() {
  const box = document.createElement('div');
  box.style.cssText = 'display:flex;flex-direction:column;row-gap:1px;position:absolute;visibility:hidden';
  box.append(document.createElement('div'), document.createElement('div'));
  document.body.append(box);
  const works = box.scrollHeight === 1;
  box.remove();
  return works;
}

// Gives one flex box's children the margins its gap asks for.
function spaceOut(box) {
  const style = getComputedStyle(box);
  if (style.display !== 'flex' && style.display !== 'inline-flex') return;
  const row = parseFloat(style.rowGap) || 0;
  const col = parseFloat(style.columnGap) || 0;
  if (!row && !col) return;
  const column = style.flexDirection.startsWith('column');
  const wraps = style.flexWrap !== 'nowrap';
  [...box.children].forEach((child, i) => {
    const own = getComputedStyle(child);
    if (own.position === 'absolute' || own.position === 'fixed') return;
    const set = (side, size) => {
      if (size && !parseFloat(own[side])) child.style[side] = `${size}px`;
    };
    if (wraps) {
      set('marginRight', col);
      set('marginBottom', row);
    } else if (i > 0) set(column ? 'marginTop' : 'marginLeft', column ? row : col);
  });
}

function spaceAll(root) {
  if (root.nodeType !== 1) return;
  spaceOut(root);
  root.querySelectorAll('*').forEach(spaceOut);
}

function start() {
  if (supportsFlexGap()) return;
  spaceAll(document.body);
  let waiting = false;
  const changed = new Set();
  new MutationObserver((records) => {
    records.forEach((r) => changed.add(r.target));
    if (waiting) return;
    waiting = true;
    requestAnimationFrame(() => {
      waiting = false;
      changed.forEach(spaceAll);
      changed.clear();
    });
  }).observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
else start();
