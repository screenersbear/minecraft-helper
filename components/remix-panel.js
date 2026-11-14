// Remix panel, on a build's cover: buttons to build it in another wood or a block palette, to flip it left to
// right, and to go back to how it was. The picked ones show pressed. onChange(remix) gets the new remix.
import { el } from './el.js';
import { blockButton } from './buttons.js';
import { WOODS, isWooden, isRemixed } from '../logic/remix.js';
import { PALETTES } from '../data/palettes.js';
import { allBlocks } from '../logic/builds.js';

const pick = (label, on, onclick) => el('button', { class: 'block-btn small-btn', type: 'button', 'aria-pressed': String(on), onclick }, label);

export function remixPanel(build, original, looks, remix, onChange) {
  const now = remix || {};
  const wooden = allBlocks(original).some(([, , , b]) => isWooden(b.id));
  const woods = WOODS.filter((w) => looks[`${w.id}_planks`]);
  return el(
    'section',
    { class: 'remix-panel panel-box', 'aria-label': 'Remix' },
    wooden ? [el('h2', { class: 'remix-label' }, 'Another wood'), el('div', { class: 'remix-row' }, woods.map((w) => pick(w.name, now.wood === w.id, () => onChange({ wood: w.id, flip: now.flip }))))] : null,
    el('h2', { class: 'remix-label' }, 'A block palette'),
    el('div', { class: 'remix-row' }, PALETTES.map((p) => pick(p.name, now.palette === p.id, () => onChange({ palette: p.id, flip: now.flip })))),
    el('h2', { class: 'remix-label' }, 'Turn it round'),
    el('div', { class: 'remix-row' }, pick('Flip left to right', !!now.flip, () => onChange({ ...now, flip: !now.flip }))),
    isRemixed(remix) ? blockButton({ label: 'Back to how it was', tone: 'grey', onClick: () => onChange(null) }) : null,
  );
}
