// The book's eight pages: Tools, Weapons, Food, Building, Redstone, Mobs, Farming, Magic. Each lists the things in
// it that the book can answer about. Colour and wood families show just one of each ("White Wool", "Oak Stairs"),
// so a page stays short enough to look through; asking still finds every colour.

const has = (list) => new Set(list.split(' '));

const RULES = {
  tools: {
    test: /_(pickaxe|shovel|axe|hoe)$/,
    also: has('shears flint_and_steel fishing_rod bucket water_bucket lava_bucket milk_bucket compass recovery_compass clock spyglass brush lead carrot_on_a_stick warped_fungus_on_a_stick map name_tag saddle'),
  },
  weapons: {
    test: /_(sword|spear|helmet|chestplate|leggings|boots|horse_armor)$/,
    also: has('bow crossbow arrow spectral_arrow tipped_arrow trident mace shield wind_charge turtle_helmet wolf_armor'),
  },
  food: { test: null, also: has('cake') },
  redstone: {
    test: /_(button|pressure_plate|rail)$|minecart$/,
    also: has('redstone redstone_torch redstone_block redstone_lamp repeater comparator piston sticky_piston observer dispenser dropper hopper lever tripwire_hook daylight_detector note_block target tnt rail lightning_rod crafter sculk_sensor calibrated_sculk_sensor trapped_chest copper_bulb'),
  },
  farming: {
    test: /_(seeds|sapling)$/,
    also: has('wheat hay_block bone_meal composter carrot potato beetroot sugar_cane sugar pumpkin melon melon_slice cocoa_beans sweet_berries egg honeycomb beehive honey_bottle cactus bamboo kelp glow_berries farmland'),
  },
  magic: {
    test: /_potion$|^potion$/,
    also: has('enchanting_table bookshelf book anvil chipped_anvil damaged_anvil brewing_stand cauldron glass_bottle blaze_powder blaze_rod ender_eye ender_pearl ender_chest end_crystal beacon conduit totem_of_undying experience_bottle lapis_lazuli nether_wart fermented_spider_eye glistering_melon_slice magma_cream dragon_breath respawn_anchor lodestone grindstone ghast_tear'),
  },
};

// Things made mostly to decorate or build with that aren't blocks in the data.
const BUILDING_ITEMS = has('painting item_frame glow_item_frame armor_stand flower_pot');

// Families with many colours or woods: only the first one shows.
const COLOURS = ['white', 'orange', 'magenta', 'light_blue', 'yellow', 'lime', 'pink', 'gray', 'light_gray', 'cyan', 'purple', 'blue', 'brown', 'green', 'red', 'black'];
const WOODS = ['oak', 'spruce', 'birch', 'jungle', 'acacia', 'dark_oak', 'mangrove', 'cherry', 'pale_oak', 'bamboo', 'crimson', 'warped'];
const AGED = /^(exposed|weathered|oxidized|waxed)_/;

function familyRest(id) {
  for (const list of [COLOURS, WOODS]) {
    const sorted = [...list].sort((a, b) => b.length - a.length);
    const p = sorted.find((x) => id.startsWith(`${x}_`));
    if (p) return { first: list[0], rest: id.slice(p.length + 1), prefix: p };
  }
  return null;
}

// Keep one of each family: the first colour or wood that's in the list.
function oneOfEach(ids) {
  const seen = new Map();
  const out = [];
  for (const id of ids) {
    if (AGED.test(id)) continue;
    const f = familyRest(id);
    if (!f) {
      out.push(id);
      continue;
    }
    const key = `${f.first}:${f.rest}`;
    if (!seen.has(key)) seen.set(key, []);
    seen.get(key).push(id);
  }
  for (const [key, members] of seen) {
    const first = members.find((m) => m.startsWith(`${key.split(':')[0]}_`)) || members[0];
    out.push(first);
  }
  return out;
}

// items: the book's items. answerable(id): it has a recipe or facts. blocks: ids of blocks. mobs: the book's mobs.
export function buildCategories(items, answerable, blocks, mobs, foods) {
  const ids = Object.keys(items).filter((id) => !id.startsWith('@') && answerable(id));
  const byName = (a, b) => items[a].name.localeCompare(items[b].name);
  const pages = {};
  const placed = new Set();
  for (const [cat, rule] of Object.entries(RULES)) {
    const inIt = ids.filter((id) => rule.also.has(id) || (rule.test && rule.test.test(id)) || (cat === 'food' && foods.has(id)));
    inIt.forEach((id) => placed.add(id));
    pages[cat] = oneOfEach(inIt).sort(byName);
  }
  const building = ids.filter((id) => !placed.has(id) && (blocks.has(id) || BUILDING_ITEMS.has(id)));
  pages.building = oneOfEach(building).sort(byName);
  pages.mobs = Object.keys(mobs).sort((a, b) => mobs[a].name.localeCompare(mobs[b].name));
  return pages;
}
