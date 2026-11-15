// Add-on switches: which add-ons a grown-up turned off on the grown-ups screen, saved on the phone. A new add-on
// starts on, so only the ones turned off are saved.
import { load, save } from './store.js';

const KEY = 'mc-helper.addons-off';

export const addonsOff = () => load(KEY, []);

export function setAddonOn(id, on) {
  const off = addonsOff().filter((x) => x !== id);
  save(KEY, on ? off : [...off, id]);
}
