// Block picker: a panel that slides up with every block a pixel art can use, wool first, then concrete and
// terracotta. Tapping one picks it and closes the panel. Used to change one square or swap a block everywhere.
import { el } from './el.js';
import { itemPicture } from './picture.js';

const KINDS = [['wool', 'Wool'], ['concrete', 'Concrete'], ['terracotta', 'Terracotta']];

// title: what the kid is picking for. ids: the blocks to offer. current: the block there now.
// onPick(id): called with the block picked. onClose(): called when the panel closes, picked or not.
// Returns a close() function.
export function openBlockPicker(book, { title, ids, current, onPick, onClose }) {
  const dialog = el('dialog', { class: 'picker', 'aria-label': title });
  const close = () => {
    if (dialog.open) dialog.close();
    dialog.remove();
  };
  const choose = (id) => {
    close();
    if (id !== current) onPick(id);
  };
  const button = (id) => {
    const name = book.items[id]?.name || id.replace(/_/g, ' ');
    return el(
      'button',
      { class: 'block-pick', type: 'button', 'aria-label': name, title: name, 'aria-pressed': String(id === current), onclick: () => choose(id) },
      itemPicture(book, id, 32),
    );
  };
  const sections = KINDS.map(([kind, label]) => {
    const some = ids.filter((id) => id.endsWith(`_${kind}`));
    return some.length ? el('section', {}, el('h3', { class: 'small-label' }, label), el('div', { class: 'block-pick-grid' }, some.map(button))) : null;
  });
  dialog.append(
    el('h2', { class: 'picker-title' }, title),
    el('div', { class: 'picker-blocks' }, sections),
    el('button', { class: 'block-btn small-btn tone-grey notch', type: 'button', onclick: close }, 'Cancel'),
  );
  // Tapping outside the panel closes it too.
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) close();
  });
  dialog.addEventListener('close', () => {
    dialog.remove();
    onClose?.();
  });
  document.body.append(dialog);
  dialog.showModal();
  dialog.querySelector('[aria-pressed="true"]')?.focus();
  return close;
}
