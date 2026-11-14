// Shelf: the bookshelf button in the Ask screen's top bar. Tapping it opens a small shelf under the bar with the
// app's extra pages on it (About this guide). Tapping the button again, anywhere else, or Escape closes it.
import { el } from './el.js';
import { itemPicture } from './picture.js';

// items: [{ label, href, pic }], pic being an item id ("book"). Returns { button, panel, cleanup }.
export function shelfMenu(book, items) {
  const panel = el(
    'nav',
    { class: 'shelf notch', id: 'shelf', hidden: true, 'aria-label': 'Shelf' },
    items.map(({ label, href, pic }) =>
      el('a', { class: 'block-btn small-btn tone-grey notch shelf-item', href }, itemPicture(book, pic, 32), el('span', {}, label)),
    ),
  );
  const button = el(
    'button',
    { class: 'shelf-btn', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'shelf' },
    itemPicture(book, 'bookshelf', 24),
    el('span', {}, 'Shelf'),
  );

  const isOpen = () => !panel.hidden;
  const setOpen = (open) => {
    panel.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
  };
  button.addEventListener('click', () => setOpen(!isOpen()));

  const onOutside = (e) => {
    if (isOpen() && !panel.contains(e.target) && !button.contains(e.target)) setOpen(false);
  };
  const onKey = (e) => {
    if (e.key === 'Escape' && isOpen()) {
      setOpen(false);
      button.focus();
    }
  };
  document.addEventListener('pointerdown', onOutside);
  document.addEventListener('keydown', onKey);
  const cleanup = () => {
    document.removeEventListener('pointerdown', onOutside);
    document.removeEventListener('keydown', onKey);
  };
  return { button, panel, cleanup };
}
