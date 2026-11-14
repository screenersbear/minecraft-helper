// Make: the second of the four home pages. A big green Surprise me button for a random build challenge, then six
// tiles: Builds, Builder tricks, Block palettes, Pixel art, Finish it and My builds. A small link at the bottom saves
// an idea for a new build.
import { el } from '../components/el.js';
import { itemPicture } from '../components/picture.js';
import { icon } from '../components/icons.js';
import { PALETTES } from '../data/palettes.js';

function tile(ctx, { href, pic, name, about }) {
  const slot = Array.isArray(pic)
    ? el('span', { class: 'slot four' }, pic.map((id) => itemPicture(ctx.book, id, 20)))
    : el('span', { class: 'slot' }, itemPicture(ctx.book, pic, 40));
  return el('a', { class: 'make-tile panel-box', href }, slot, el('b', {}, name), el('small', {}, about));
}

export function makePanel(ctx) {
  const builds = (ctx.builds?.builds || []).filter((b) => b.group === 'Builds' || b.group === 'Room ideas').length;
  const tiles = [
    { href: '#/builds', pic: 'bricks', name: 'Builds', about: `${builds} to copy, layer by layer` },
    { href: '#/tricks', pic: 'oak_stairs', name: 'Builder tricks', about: 'Roofs, walls, trees, lights' },
    { href: '#/palettes', pic: PALETTES[0].blocks.slice(0, 4), name: 'Block palettes', about: 'Blocks that look good together' },
    { href: '#/pixel', pic: 'painting', name: 'Pixel art', about: 'From a photo or a picture' },
    { href: '#/finish', pic: 'scaffolding', name: 'Finish it', about: 'Half-built, you finish it' },
    { href: '#/mine', pic: 'item_frame', name: 'My builds', about: 'Photos of what you made' },
  ];
  const node = el(
    'div',
    { class: 'page home-page make' },
    el('h1', { class: 'home-title', tabindex: '-1' }, 'Make'),
    el('a', { class: 'surprise-btn', href: '#/surprise' }, icon('spark', 34), el('span', {}, 'Surprise me!')),
    el('p', { class: 'surprise-note' }, 'Get a random build challenge'),
    el('div', { class: 'make-grid' }, tiles.map((t) => tile(ctx, t))),
    el('a', { class: 'idea-link', href: '#/idea' }, 'Want to build something else? Save it as an idea'),
  );
  return { node };
}
