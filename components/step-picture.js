// Step picture: what goes with a guide step. A build pattern or one item in a slot, a legend of the blocks,
// and what the next step is. stepPictureToFit draws it as big as fits in a space (a step screen's middle).
import { el } from './el.js';
import { icon } from './icons.js';
import { itemPicture } from './picture.js';
import { patternPicture, patternLegend } from './pattern.js';

const firstThing = (step) => step.item || (step.key && Object.values(step.key)[0]);

function nextUp(book, next) {
  const id = firstThing(next);
  const picture = id ? itemPicture(book, id, 24) : el('span', { class: 'legend-icon' }, icon('arrow', 20));
  return el('li', { class: 'next-up' }, picture, el('span', {}, `Next: ${next.title[0].toLowerCase()}${next.title.slice(1)}`));
}

// scale: the picture bigger or smaller than usual (2: twice as big).
export function stepPicture(book, step, next, scale = 1) {
  let picture = null;
  let legend = [];
  if (step.pattern) {
    picture = patternPicture(book, step, scale);
    legend = patternLegend(book, step);
  } else if (step.item) {
    const size = Math.round(56 * scale);
    picture = el('div', { class: 'panel', style: { '--slot-size': `${size}px` } }, el('div', { class: 'slot result' }, itemPicture(book, step.item, size)));
    legend = [el('li', {}, itemPicture(book, step.item, 24), el('span', {}, book.items[step.item]?.name || step.item))];
  }
  if (next) legend.push(nextUp(book, next));
  if (!picture && !legend.length) return null;
  return el('div', { class: 'step-picture' }, picture, el('ul', { class: 'legend' }, legend));
}

// Whether a step has a picture (not just the words for what's next).
export const hasPicture = (step) => Boolean(step.pattern || step.item);

// The step picture in box, as big as fits in width by height with its legend beside it. An item grows in steps of
// 16 pixels (its picture is 16 by 16), a pattern in eighths, so the pixels stay even.
export function stepPictureToFit(box, book, step, next, width, height) {
  box.replaceChildren(stepPicture(book, step, next));
  const whole = box.firstElementChild;
  const picture = whole?.firstElementChild;
  if (!picture || !picture.offsetWidth) return;
  const legend = whole.lastElementChild;
  const room = Math.min((width - legend.offsetWidth - 18) / picture.offsetWidth, height / picture.offsetHeight);
  const scale = step.item ? Math.max(32, Math.min(160, Math.floor((56 * room) / 16) * 16)) / 56 : Math.max(0.5, Math.min(2.5, Math.floor(room * 8) / 8));
  box.replaceChildren(stepPicture(book, step, next, scale));
}
