// Families: groups of items where any one will do in a recipe ("any wood planks", "any wool").
// Used when several recipes are the same except for one ingredient of the same family.

export const COLORS = [
  'white', 'orange', 'magenta', 'light_blue', 'yellow', 'lime', 'pink', 'gray',
  'light_gray', 'cyan', 'purple', 'blue', 'brown', 'green', 'red', 'black',
];
export const WOODS = ['oak', 'spruce', 'birch', 'jungle', 'acacia', 'dark_oak'];

// A family: its id in the book, its friendly name, the item whose picture stands for it, and a test.
export const FAMILIES = [
  { id: '@planks', name: 'wood planks', pic: 'oak_planks', note: 'any kind', test: (id) => id.endsWith('_planks') },
  { id: '@logs', name: 'logs', pic: 'oak_log', note: 'any kind', test: (id) => /(_log|_wood|_stem|_hyphae)$/.test(id) },
  { id: '@wool', name: 'wool', pic: 'white_wool', note: 'any colour', test: (id) => id.endsWith('_wool') },
  { id: '@stone_tools', name: 'cobblestone', pic: 'cobblestone', note: 'or blackstone or cobbled deepslate', test: (id) => ['cobblestone', 'blackstone', 'cobbled_deepslate'].includes(id) },
  { id: '@coal', name: 'coal', pic: 'coal', note: 'or charcoal', test: (id) => id === 'coal' || id === 'charcoal' },
  { id: '@slabs', name: 'wood slabs', pic: 'oak_slab', note: 'any kind', test: (id) => /^(oak|spruce|birch|jungle|acacia|dark_oak|mangrove|cherry|bamboo|crimson|warped|pale_oak)_slab$/.test(id) },
  { id: '@sand', name: 'sand', pic: 'sand', note: 'or red sand', test: (id) => id === 'sand' || id === 'red_sand' },
  { id: '@quartz_blocks', name: 'quartz blocks', pic: 'quartz_block', note: 'any kind', test: (id) => /quartz_(block|pillar|bricks)$|^smooth_quartz$|^chiseled_quartz_block$/.test(id) },
  { id: '@leaves', name: 'leaves', pic: 'oak_leaves', note: 'any kind', test: (id) => id.endsWith('_leaves') },
  { id: '@egg', name: 'egg', pic: 'egg', note: 'any colour', test: (id) => /^(brown_|blue_)?egg$/.test(id) },
  { id: '@purpur', name: 'purpur blocks', pic: 'purpur_block', note: 'any kind', test: (id) => id === 'purpur_block' || id === 'purpur_pillar' },
];

const PREFIX = new RegExp(`^(${[...COLORS, ...WOODS, 'mangrove', 'cherry', 'bamboo', 'crimson', 'warped', 'pale_oak'].join('|')})_`);

// What's left of an id without its colour or wood ("red_bed" -> "bed"), or null if it has neither.
export function baseOf(id) {
  const base = id.replace(PREFIX, '');
  return base === id ? null : base;
}

// Which family an item belongs to, or null.
export function familyOf(id) {
  if (id.startsWith('@')) return FAMILIES.find((f) => f.id === id) || null;
  for (const f of FAMILIES) if (f.test(id)) return f;
  return null;
}

// Several colours or woods of one thing ("red bed", "blue bed") become "@bed": any bed.
function sharedBase(ids) {
  const bases = ids.map(baseOf);
  return bases[0] && bases.every((b) => b === bases[0]) ? bases[0] : null;
}

// Turn a list of interchangeable items into one recipe cell.
// Several items from one family become that family ("@planks"); otherwise "a|b|c".
export function cellFor(options) {
  const unique = [...new Set(options)];
  if (unique.length === 1) return unique[0];
  const fams = unique.map(familyOf);
  const first = fams[0];
  if (first && fams.every((f) => f === first)) return first.id;
  const base = sharedBase(unique);
  if (base && unique.length > 2) return `@${base}`;
  return unique.join('|');
}

// For comparing Bedrock and Java recipes: collapse an id to its family so small naming differences don't count.
export function looseId(id) {
  if (!id || id.startsWith('@')) return id;
  const f = familyOf(id);
  return f ? f.id : id;
}
