// Add-on changes, under a regular answer about a mob an add-on changes (the drowned in The Bloop): what's different,
// with the add-on's tag and a button to its answer. say: the words to read out after the regular answer.
import { el } from './el.js';
import { blockButton } from './buttons.js';
import { changesFor, addonKey, askFor, MAYBE } from '../logic/addon.js';
import { toHash, deeperHash } from '../logic/routes.js';

export function addonChanges(ctx, target) {
  const changes = changesFor(ctx.addons, target);
  if (!changes.length) return { node: null, say: '' };
  const words = (c) => (c.sure ? c.say : `${c.say} ${MAYBE}`);
  const card = (c) => {
    const ask = askFor(c.pack, c.id) || `More about ${c.pack.name}`;
    const href = deeperHash(toHash({ page: 'addon', id: addonKey(c.pack, c.id), q: ask }), location.hash);
    return el(
      'section',
      { class: 'addon-change' },
      el('span', { class: 'tag addon-tag', style: { '--pack': c.pack.colour } }, `${c.pack.name} add-on`),
      el('p', { class: 'say' }, words(c)),
      blockButton({ label: ask, tone: 'grey', href, extra: { class: 'block-btn tone-grey small-btn' } }),
    );
  };
  return { node: el('div', { class: 'addon-changes' }, changes.map(card)), say: changes.map(words).join(' ') };
}
