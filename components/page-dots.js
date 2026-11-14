// Page squares: the four small squares in the top bar, one per page. The open page's square is yellow.
// Each square is a button too, so tapping one opens that page.
import { el } from './el.js';

// names: each page's name, for screen readers. onPick(i): a square was tapped.
export function pageDots(names, index, onPick) {
  const buttons = names.map((name, i) =>
    el('button', { class: 'dot-btn', type: 'button', 'aria-label': name, onclick: () => onPick(i) }, el('span', { class: 'dot' })),
  );
  const node = el('nav', { class: 'page-dots', 'aria-label': 'Pages' }, buttons);
  const show = (at) =>
    buttons.forEach((b, i) => {
      b.classList.toggle('on', i === at);
      b.setAttribute('aria-current', i === at ? 'page' : 'false');
    });
  show(index);
  return { node, show };
}
