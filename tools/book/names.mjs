// Friendly names: the game's English names from minecraft-data, with a few changed to what kids (and Bedrock) call them.
import { FAMILIES, baseOf } from './families.mjs';

const OVERRIDES = {
  netherite_upgrade_smithing_template: 'Netherite Upgrade Template',
  empty_locator_map: 'Empty Locator Map',
  map: 'Empty Map',
  water: 'Water',
  lava: 'Lava',
};

// things: minecraft-data's Java items and blocks, each with the game's English displayName. Returns id -> name.
export function namer(things) {
  const names = new Map(things.map((t) => [t.name, t.displayName]));
  return (id) => {
    if (OVERRIDES[id]) return OVERRIDES[id];
    if (id.startsWith('@')) {
      const fam = FAMILIES.find((f) => f.id === id);
      if (fam) return fam.name;
      const base = id.slice(1);
      return names.get(`white_${base}`)?.replace(/^White /, '') || base.replace(/_/g, ' ');
    }
    return names.get(id) || null;
  };
}

// entities: minecraft-data's Java entities.
export const mobName = (entities, id) => entities.find((e) => e.name === id)?.displayName || null;

// "Any colour" or "any kind" for families, so the list can say "3 wool, any colour".
export function familyNote(id) {
  const fam = FAMILIES.find((f) => f.id === id);
  if (fam) return fam.note;
  return null;
}

// The item whose picture stands for a family ("@bed" -> white_bed).
export function familyPicture(id, exists) {
  const fam = FAMILIES.find((f) => f.id === id);
  if (fam) return fam.pic;
  const base = id.slice(1);
  return [`white_${base}`, `oak_${base}`, base].find(exists) || null;
}

export { baseOf };
