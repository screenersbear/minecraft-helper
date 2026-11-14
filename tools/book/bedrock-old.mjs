// Reads minecraft-data's Bedrock 1.19.10 recipes (MIT), the newest Bedrock recipes it has. The book takes its
// furnace, stonecutter and smithing recipes from here, plus the few crafting recipes only Bedrock has.
// Old Bedrock named many things with one word and a number ("stone_block_slab" number 3 is the andesite slab), and
// the data lost the number on results. A result like that can't be told apart, so it's left out.
import { modernId } from './bedrock-names.mjs';
import { looseId } from './families.mjs';

const LOST = new Set([
  'stone_block_slab', 'stone_block_slab2', 'stone_block_slab3', 'stone_block_slab4', 'stone_slab', 'double_stone_slab',
  'stonebrick', 'stone', 'sandstone', 'red_sandstone', 'quartz_block', 'purpur_block', 'prismarine', 'cobblestone_wall',
  'sponge', 'wool', 'carpet', 'concrete', 'concrete_powder', 'stained_glass', 'stained_glass_pane', 'stained_hardened_clay',
  'planks', 'log', 'log2', 'wood', 'dye', 'dirt', 'coral_block', 'double_plant', 'red_flower', 'sapling', 'leaves', 'leaves2',
]);
const bare = (name) => String(name).replace(/^minecraft:/, '');
const COLOURS = ['white', 'orange', 'magenta', 'light_blue', 'yellow', 'lime', 'pink', 'gray', 'light_gray', 'cyan', 'purple', 'blue', 'brown', 'green', 'red', 'black'];

// The result's modern id, or null when the data lost which one it was.
function resultId(r) {
  const out = r.output[0];
  if (LOST.has(bare(out.name)) && r.type !== 'furnace') return null;
  return modernId(out.name, out.metadata ?? 0);
}

const ingredientId = (i) => modernId(i.name, i.metadata);

// Furnace: one thing in, one thing out.
function furnace(r) {
  const makes = resultId(r);
  let input = ingredientId(r.ingredients[0]);
  // Glazed terracotta lost its colour on the way in: it's always made from terracotta of the same colour.
  const glazed = /^(.+)_glazed_terracotta$/.exec(makes || '');
  if (glazed && COLOURS.includes(glazed[1])) input = `${glazed[1]}_terracotta`;
  // Something smelted into itself means the data lost which kind the result is (smooth sandstone, cracked bricks).
  if (!makes || !input || makes === input) return null;
  return { makes, count: r.output[0].count, how: 'furnace', input };
}

function stonecutter(r) {
  const makes = resultId(r);
  const input = ingredientId(r.ingredients[0]);
  if (!makes || !input || makes === input) return null;
  return { makes, count: r.output[0].count, how: 'stonecutter', input };
}

// Smithing in 1.19 was a diamond thing plus a netherite ingot. Since 1.20 it also needs a Netherite Upgrade
// template (minecraft.wiki, Smithing Table), so the template goes in the first slot.
function smithing(r) {
  const makes = resultId(r);
  const [base, addition] = r.ingredients.map(ingredientId);
  if (!makes || !base || !addition) return null;
  return { makes, count: 1, how: 'smithing', slots: ['netherite_upgrade_smithing_template', base, addition] };
}

// Crafting, as a grid of ids. "input" holds numbers that point into the ingredient list (1 is the first).
function crafting(r) {
  const makes = resultId(r);
  if (!makes) return null;
  const ids = r.ingredients.map(ingredientId);
  if (ids.some((x) => !x)) return null;
  const shapeless = r.type === 'crafting_table_shapeless';
  const grid = r.input.map((row) => row.map((n) => (n ? ids[n - 1] : null)));
  const back = r.output.slice(1).map((o) => [modernId(o.name, o.metadata ?? 0), o.count]).filter(([id]) => id);
  return { makes, count: r.output[0].count, how: 'crafting', grid, shapeless, ...(back.length ? { back } : {}) };
}

const READERS = { furnace, stonecutter, smithing_table: smithing, crafting_table: crafting, crafting_table_shapeless: crafting };

// Every recipe the book can trust, as { makes, count, how, grid | input | slots }.
export function readOldBedrock(raw) {
  return Object.values(raw)
    .map((r) => READERS[r.type]?.(r))
    .filter(Boolean);
}

// Crafting needs, loosely ("any wool": 3, "any planks": 3), grouped by what they make. For checking Java recipes.
export function oldBedrockNeeds(raw) {
  const out = new Map();
  for (const r of Object.values(raw)) {
    if (!r.type.startsWith('crafting_table')) continue;
    const makes = modernId(r.output[0].name, r.output[0].metadata);
    const ids = r.ingredients.map(ingredientId);
    if (!makes || ids.some((x) => !x)) continue;
    const needs = new Map();
    r.ingredients.forEach((i, n) => needs.set(looseId(ids[n]), (needs.get(looseId(ids[n])) || 0) + i.count));
    const key = makes.replace(/^(white|orange|magenta|light_blue|yellow|lime|pink|gray|light_gray|cyan|purple|blue|brown|green|red|black|oak|spruce|birch|jungle|acacia|dark_oak)_/, '*_');
    if (!out.has(key)) out.set(key, []);
    out.get(key).push({ count: r.output[0].count, needs });
  }
  return out;
}

// Every thing old Bedrock's recipes mention. A Java recipe using something not in here is newer than this data.
export function oldBedrockIds(raw) {
  const ids = new Set();
  for (const r of Object.values(raw)) for (const x of [...r.ingredients, ...r.output]) ids.add(modernId(x.name, x.metadata));
  return ids;
}
