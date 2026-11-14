// Step picture: what goes with a guide step. A build pattern or one item in a slot, a legend of the blocks,
// and what the next step is.
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

export function stepPicture(book, step, next) {
  let picture = null;
  let legend = [];
  if (step.pattern) {
    picture = patternPicture(book, step);
    legend = patternLegend(book, step);
  } else if (step.item) {
    picture = el('div', { class: 'panel' }, el('div', { class: 'slot result' }, itemPicture(book, step.item, 56)));
    legend = [el('li', {}, itemPicture(book, step.item, 24), el('span', {}, book.items[step.item]?.name || step.item))];
  }
  if (next) legend.push(nextUp(book, next));
  if (!picture && !legend.length) return null;
  return el('div', { class: 'step-picture' }, picture, el('ul', { class: 'legend' }, legend));
}
