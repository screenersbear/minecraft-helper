// Add-ons: the fifth home page, for Marketplace add-ons kids play, kept apart from the regular game. Each add-on
// gets a plain colour cover with its name (never its own pictures or logo), a Hold to ask button that only searches
// that add-on, and its topics as rows, each saying how many more answers sit behind it.
import { el } from '../components/el.js';
import { talkButton } from '../components/talk-button.js';
import { toHash } from '../logic/routes.js';
import { addonKey, countBehind, behindLabel } from '../logic/addon.js';
import { askAddon } from './addon-answer.js';

function cover(pack) {
  return el(
    'div',
    { class: 'addon-cover notch', style: { '--pack': pack.colour } },
    el('span', { class: 'addon-kind' }, 'Add-on'),
    el('b', { class: 'addon-name' }, pack.name),
    el('span', { class: 'addon-by' }, `by ${pack.by}`),
  );
}

// Hold to ask about the add-on, or type it.
function askBox(ctx, pack) {
  const ask = (q) => askAddon(ctx, pack, q);
  const input = el('input', { id: `addon-q-${pack.id}`, type: 'text', placeholder: `Ask about ${pack.name}`, autocomplete: 'off', autocapitalize: 'sentences', enterkeyhint: 'go', maxlength: '120' });
  const submit = (e) => {
    e.preventDefault();
    input.blur();
    ask(input.value);
  };
  const form = el('form', { class: 'type-it addon-type', onsubmit: submit }, el('label', { for: input.id, class: 'small-label' }, 'Or type it'), input);
  const talk = talkButton({ small: true, about: `about ${pack.name}`, onQuestion: ask, onNoMic: () => input.focus() });
  const [button, label, heard] = talk.nodes;
  const hold = el('section', { class: 'ask-more addon-ask', 'aria-label': `Ask about ${pack.name}` }, button, el('div', { class: 'ask-more-text' }, label, heard));
  return { nodes: [hold, form], stop: talk.stop };
}

const row = (pack, id) =>
  el(
    'a',
    { class: 'guide-row addon-row', href: toHash({ page: 'addon', id: addonKey(pack, id), from: 'addons' }) },
    el('b', {}, pack.answers[id].title),
    el('span', {}, behindLabel(countBehind(pack, id))),
  );

export function addonsPanel(ctx) {
  const packs = ctx.addons || [];
  const boxes = [];
  const section = (pack) => {
    const box = askBox(ctx, pack);
    boxes.push(box);
    const topics = pack.topics.filter((id) => pack.answers[id]).map((id) => row(pack, id));
    return el('section', { class: 'addon', 'aria-label': pack.name }, cover(pack), box.nodes, el('h2', { class: 'small-label addon-topics' }, 'Topics'), el('div', { class: 'guide-rows' }, topics));
  };
  const node = el(
    'div',
    { class: 'page home-page' },
    el('h1', { class: 'home-title', tabindex: '-1' }, 'Add-ons'),
    el('p', { class: 'home-intro' }, 'Add-ons from the Marketplace change the game, so their answers live here, apart from the rest.'),
    packs.length ? packs.map(section) : el('p', { class: 'say' }, 'No add-ons yet.'),
    el('p', { class: 'swipe-hint' }, 'Swipe back for guides'),
  );
  return { node, cleanup: () => boxes.forEach((b) => b.stop()) };
}
