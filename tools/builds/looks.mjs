// How each block in the builds looks: its shape and which Pixel Perfection CE pictures go on its top, sides and
// front. Shaped blocks (stairs, slabs, fences, carpets, beds) borrow the pictures of what they're made from.

// Blocks whose top, side or front need their own picture.
const OWN = {
  bookshelf: { top: 'oak_planks', side: 'bookshelf' },
  hay_block: { top: 'hay_block_top', side: 'hay_block_side' },
  furnace: { top: 'furnace_top', side: 'furnace_side', front: 'furnace_front' },
  smoker: { top: 'smoker_top', side: 'smoker_side', front: 'smoker_front' },
  crafting_table: { top: 'crafting_table_top', side: 'crafting_table_side', front: 'crafting_table_front' },
  barrel: { top: 'barrel_top', side: 'barrel_side' },
  loom: { top: 'loom_top', side: 'loom_side', front: 'loom_front' },
  composter: { top: 'composter_top', side: 'composter_side' },
  cauldron: { top: ['cauldron_inner', 'cauldron_top'], side: 'cauldron_side' },
  grass_block: { top: 'grass_block_top', side: 'grass_block_side' },
  pumpkin: { top: 'pumpkin_top', side: 'pumpkin_side' },
  carved_pumpkin: { top: 'pumpkin_top', side: 'pumpkin_side', front: 'carved_pumpkin' },
  jack_o_lantern: { top: 'pumpkin_top', side: 'pumpkin_side', front: 'jack_o_lantern' },
  melon: { top: 'melon_top', side: 'melon_side' },
  sandstone: { top: 'sandstone_top', side: 'sandstone' },
  smooth_sandstone: { top: 'sandstone_top', side: 'sandstone_top' },
  snow_block: { top: 'snow', side: 'snow' },
  target: { top: 'target_top', side: 'target_side' },
  water: { top: 'water_still', side: 'water_still', see: 0.8 },
  glass: { top: 'glass', side: 'glass', see: 1, pane: true },
  campfire: { shape: 'campfire', top: 'campfire_log_lit', side: 'campfire_log_lit', sprite: 'campfire_fire' },
  ladder: { shape: 'ladder', top: 'ladder', side: 'ladder' },
  smooth_stone_slab: { shape: 'slab', top: 'smooth_stone', side: 'smooth_stone_slab_side' },
  beehive: { top: 'beehive_end', side: 'beehive_side', front: 'beehive_front' },
  farmland: { top: 'farmland_moist', side: 'dirt' },
  // The lantern's block picture is a cut-out sheet, so it borrows the item picture.
  lantern: { shape: 'sprite', sprite: '../item/lantern' },
};

// Crops are named by what you plant, and show fully grown.
const CROPS = {
  wheat_seeds: 'wheat_stage7', carrot: 'carrots_stage3', potato: 'potatoes_stage3', beetroot_seeds: 'beetroots_stage3',
  sweet_berries: 'sweet_berry_bush_stage3',
};

// Flat pictures standing up.
const SPRITES = new Set([
  'torch', 'poppy', 'dandelion', 'cornflower', 'oxeye_daisy', 'blue_orchid', 'allium', 'red_tulip', 'orange_tulip',
  'white_tulip', 'pink_tulip', 'azure_bluet', 'lily_of_the_valley', 'oak_sapling', 'sugar_cane', 'red_mushroom', 'brown_mushroom',
]);

// What a shaped block is made of: "stone_brick_stairs" -> stone_bricks, "oak_fence" -> oak_planks.
function material(base, has) {
  const special = { smooth_stone: 'smooth_stone', sandstone: 'sandstone', brick: 'bricks', stone_brick: 'stone_bricks', mossy_stone_brick: 'mossy_stone_bricks' };
  const tries = [special[base], base, `${base}s`, `${base}_planks`, `${base}_block`].filter(Boolean);
  return tries.find(has) || null;
}

// The look of one block id: { shape, top, side, front, sprite, pillow, see } with picture names (or [under, over]
// for two pictures on top of each other), or null when there's no picture for it.
export function lookFor(id, has) {
  if (OWN[id]) return { ...OWN[id] };
  if (SPRITES.has(id)) return has(id) ? { shape: 'sprite', sprite: id } : null;
  if (CROPS[id]) return has(CROPS[id]) ? { shape: 'sprite', sprite: CROPS[id] } : null;
  if (id.endsWith('_log') && has(id) && has(`${id}_top`)) return { top: `${id}_top`, side: id };
  const bed = /^(.+)_bed$/.exec(id);
  if (bed) return has(`${bed[1]}_wool`) ? { shape: 'bed', top: `${bed[1]}_wool`, side: `${bed[1]}_wool`, pillow: 'white_wool' } : null;
  const carpet = /^(.+)_carpet$/.exec(id);
  if (carpet) return has(`${carpet[1]}_wool`) ? { shape: 'carpet', top: `${carpet[1]}_wool`, side: `${carpet[1]}_wool` } : null;
  // A fence gate is drawn like a piece of fence.
  for (const [end, shape] of [['_stairs', 'stairs'], ['_slab', 'slab'], ['_fence_gate', 'fence'], ['_fence', 'fence']]) {
    if (!id.endsWith(end)) continue;
    const from = material(id.slice(0, -end.length), has);
    return from ? { shape, top: from, side: from } : null;
  }
  if (has(id)) return { top: id, side: id, ...(id.endsWith('_leaves') ? { leaves: true } : {}) };
  return null;
}

// Grey pictures the game colours in, as 0xRRGGBB.
export const TINTS = {
  oak_leaves: 0x48b518, birch_leaves: 0x80a755, spruce_leaves: 0x619961, jungle_leaves: 0x48b518,
  grass_block_top: 0x91bd59, water_still: 0x3f76e4,
};
