// Pixel art, step 2 (#/pixel/<id>): the picture made of blocks, a switch back to the photo, the Colours slider and
// the Outline and Wool only switches, and every block it needs, most first. Tap a square to change it, or a block in
// the list to swap it everywhere. Build it goes row by row. A ready-made picture has no photo, so it has no photo
// switch and no Colours slider.
import { el } from '../components/el.js';
import { topBar } from '../components/top-bar.js';
import { blockButton } from '../components/buttons.js';
import { blockArt } from '../components/block-art.js';
import { artControls } from '../components/art-controls.js';
import { openBlockPicker } from '../components/block-picker.js';
import { itemPicture } from '../components/picture.js';
import { getArt, updateArt, removeArt } from '../data/pixel-store.js';
import { photoPixels } from '../data/art-photo.js';
import { prepareClose, blocksFrom, lookOf, WORK } from '../logic/pixel-convert.js';
import { editSquare, swapBlock } from '../logic/pixel-edits.js';
import { choices } from '../logic/pixel.js';
import { blockCounts, countText } from '../logic/pixel-rows.js';
import { listWords } from '../logic/plural.js';
import { toHash } from '../logic/routes.js';

// "You need 140 white wool, 60 black wool and 3 more kinds of block."
function needSentence(book, counts) {
  const top = counts.slice(0, 2).map((c) => countText(book, c));
  const more = counts.length - top.length;
  if (more > 0) top.push(`${more} more kind${more === 1 ? '' : 's'} of block`);
  return `Here it is in blocks. You need ${listWords(top)}.`;
}

const blockName = (book, id) => (book.items[id]?.name || id.replace(/_/g, ' ')).toLowerCase();

export function pixelResultPage(ctx, route) {
  let art = getArt(route.id);
  if (!art) return null;
  const { book } = ctx;
  const sayLine = el('p', { class: 'say' });
  const view = el('div', { class: 'art-view' });
  const list = el('div', { class: 'need-list' });
  let showing = 'blocks';
  let closePicker = null;
  const offered = () => choices(book.palette, lookOf(art).woolOnly).map((c) => c.id);

  // Saves changes and draws the picture and the list again (the page itself stays, so the slider keeps working).
  const save = (changes) => {
    art = updateArt(art.id, changes) || art;
    draw();
  };
  const pickSquare = (i) => {
    draw(i);
    closePicker = openBlockPicker(book, {
      title: 'Pick a block for this square',
      ids: offered(),
      current: art.blocks[art.cells[i]],
      onPick: (id) => save(editSquare(art, i, id)),
      onClose: () => draw(),
    });
  };
  const pickSwap = (from) => {
    closePicker = openBlockPicker(book, {
      title: `Swap ${blockName(book, from)} everywhere for`,
      ids: offered(),
      current: from,
      onPick: (to) => save(swapBlock(art, from, to)),
    });
  };

  function draw(picked = -1) {
    const counts = blockCounts(art);
    sayLine.textContent = needSentence(book, counts);
    view.replaceChildren(
      showing === 'blocks' ? blockArt(book, art, { picked, onTap: pickSquare }) : el('img', { class: 'art-photo', src: art.photo, alt: 'The photo' }),
    );
    list.replaceChildren(
      el('h2', { class: 'small-label' }, 'Blocks you need, most first. Tap one to swap it.'),
      el(
        'ul',
        { class: 'need-rows' },
        counts.map((c) =>
          el('li', {}, el('button', { class: 'need-btn', type: 'button', onclick: () => pickSwap(c.id) }, itemPicture(book, c.id, 24), el('span', {}, countText(book, c)))),
        ),
      ),
    );
  }

  // Makes the blocks again from the photo with new settings. The photo is prepared once (the slow part), then each
  // change only redoes the blocks. Only the newest request counts.
  let asked = 0;
  let prep = null;
  const remake = async (changes) => {
    const mine = ++asked;
    const look = { ...art, ...changes };
    try {
      prep = prep || (await prepareClose((part) => photoPixels(art.photo, WORK, part)));
      const made = blocksFrom(prep, art.size, book.palette, look);
      if (mine !== asked) return;
      const { blocks, cells, background, autoColours, mostColours } = made;
      save({ ...changes, blocks, cells, background, autoColours, mostColours, rgb: undefined });
    } catch {
      if (mine === asked) save(changes);
    }
  };
  let waiting = 0;
  const controls = artControls({ look: lookOf(art), auto: art.autoColours, most: art.mostColours, canOutline: art.background !== false }, {
    onColours: (colours) => {
      clearTimeout(waiting);
      waiting = setTimeout(() => remake({ colours }), 60);
    },
    onOutline: (outline) => remake({ outline }),
    onWool: (woolOnly) => remake({ woolOnly }),
  });

  const switchRow = el('div', { class: 'switch-row' });
  const show = (which) => {
    showing = which;
    switchRow.querySelectorAll('button').forEach((b, i) => b.setAttribute('aria-pressed', String((i === 0) === (which === 'blocks'))));
    draw();
  };
  switchRow.append(
    el('button', { class: 'switch-btn', type: 'button', 'aria-pressed': 'true', onclick: () => show('blocks') }, 'Blocks'),
    el('button', { class: 'switch-btn', type: 'button', 'aria-pressed': 'false', onclick: () => show('photo') }, 'Photo'),
  );
  draw();

  const next = Math.min(art.row + 1, art.size);
  const remove = el('button', {
    class: 'text-btn',
    type: 'button',
    // Deletes saved pixel art for good, so automatic click tests skip it and it asks first.
    'data-test-skip': 'deletes saved pixel art',
    onclick: () => {
      if (!window.confirm(`Delete "${art.name}"? This can't be undone.`)) return;
      removeArt(art.id);
      ctx.go('#/make', { replace: true });
    },
  }, 'Delete it');

  const nodes = [
    ...topBar({ left: { label: 'Back', href: '#/make' }, right: 'Pixel art' }),
    el(
      'div',
      { class: 'page pixel-result' },
      el('h1', { class: 'answer-title', 'data-fit': '2', tabindex: '-1' }, art.name),
      sayLine,
      art.photo ? switchRow : null,
      view,
      el('p', { class: 'small-label tap-hint' }, 'Tap a square to change its block.'),
      art.photo ? controls : null,
      list,
      el(
        'div',
        { class: 'bottom' },
        el(
          'div',
          { class: 'two-up' },
          blockButton({ label: art.row > 0 && art.row < art.size ? 'Keep going' : 'Build it', tone: 'mango', href: toHash({ page: 'pixel', id: art.id, step: next }) }),
          blockButton({ label: 'Redo', tone: 'grey', href: '#/make' }),
        ),
        remove,
      ),
    ),
  ];
  const cleanup = () => {
    clearTimeout(waiting);
    asked += 1;
    closePicker?.();
  };
  return { nodes, say: sayLine.textContent, title: art.name, cleanup };
}
