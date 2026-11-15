// More panel: the rest of a step (all its words, "Want to know more?", a tip) in a panel that slides up, with a big
// Close button. Like the block picker it's a <dialog> (old Safari gets a stand-in, see old-safari/dialog.js).
// Tapping a link in it goes there and closes it.
import { el } from './el.js';

export function openMorePanel(nodes) {
  const dialog = el('dialog', { class: 'picker more-panel', 'aria-label': 'More' });
  const close = () => {
    window.removeEventListener('hashchange', close);
    if (dialog.open) dialog.close();
    dialog.remove();
  };
  dialog.append(el('div', { class: 'more-words' }, nodes), el('button', { class: 'block-btn tone-grey', type: 'button', onclick: close }, 'Close'));
  // Tapping outside the panel closes it too.
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) close();
  });
  dialog.addEventListener('close', close);
  window.addEventListener('hashchange', close);
  document.body.append(dialog);
  dialog.showModal();
  return close;
}
