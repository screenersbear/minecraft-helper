// Add-on switches, on the grown-ups screen: one per add-on, on or off. An add-on that's off leaves Guides (its
// topics, and its chapter if nothing else is in it), and its answers can't be opened.
import { el } from './el.js';
import { addonsOff, setAddonOn } from '../data/addon-switches.js';

// The words on a switch: "The Bloop add-on: on".
const label = (pack, on) => `${pack.name} add-on: ${on ? 'on' : 'off'}`;

function addonSwitch(pack, off) {
  let on = !off.includes(pack.id);
  const button = el('button', { class: 'switch-btn toggle-btn addon-switch', type: 'button', 'aria-pressed': String(on) }, label(pack, on));
  button.addEventListener('click', () => {
    on = !on;
    setAddonOn(pack.id, on);
    button.setAttribute('aria-pressed', String(on));
    button.textContent = label(pack, on);
  });
  return button;
}

// packs: every add-on, on or off.
export function addonSwitches(packs) {
  if (!packs?.length) return null;
  const off = addonsOff();
  return el(
    'section',
    { class: 'addon-switches' },
    el('h2', { class: 'log-subtitle' }, 'Add-ons'),
    el('p', { class: 'say' }, "Turn off an add-on the kids don't play any more. Its topics leave Guides until it's turned back on."),
    packs.map((pack) => addonSwitch(pack, off)),
  );
}
