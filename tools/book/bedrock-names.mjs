// Turns Bedrock item ids into the Java-style names the rest of the book uses. Some Bedrock ids still use a number
// ("data") for the kind: dye 15 is bone meal, bucket 1 is a milk bucket, banner 0 is a black banner.
import { COLORS, WOODS } from './families.mjs';

// Bedrock's old dye numbers, and the colours its banners use (same order).
const DYE_COLORS = ['black', 'red', 'green', 'brown', 'blue', 'purple', 'cyan', 'light_gray', 'gray', 'pink', 'lime', 'yellow', 'light_blue', 'magenta', 'orange', 'white'];
const DYES = [
  'ink_sac', 'red_dye', 'green_dye', 'cocoa_beans', 'lapis_lazuli', 'purple_dye', 'cyan_dye', 'light_gray_dye', 'gray_dye', 'pink_dye',
  'lime_dye', 'yellow_dye', 'light_blue_dye', 'magenta_dye', 'orange_dye', 'bone_meal', 'black_dye', 'brown_dye', 'blue_dye', 'white_dye',
];

const byNumber = {
  planks: WOODS.map((w) => `${w}_planks`),
  log: ['oak_log', 'spruce_log', 'birch_log', 'jungle_log'],
  log2: ['acacia_log', 'dark_oak_log'],
  wool: COLORS.map((c) => `${c}_wool`),
  bed: COLORS.map((c) => `${c}_bed`),
  carpet: COLORS.map((c) => `${c}_carpet`),
  concrete_powder: COLORS.map((c) => `${c}_concrete_powder`),
  stained_glass: COLORS.map((c) => `${c}_stained_glass`),
  stained_glass_pane: COLORS.map((c) => `${c}_stained_glass_pane`),
  stained_hardened_clay: COLORS.map((c) => `${c}_terracotta`),
  stone: ['stone', 'granite', 'polished_granite', 'diorite', 'polished_diorite', 'andesite', 'polished_andesite'],
  sand: ['sand', 'red_sand'],
  sandstone: ['sandstone', 'chiseled_sandstone', 'cut_sandstone', 'smooth_sandstone'],
  red_sandstone: ['red_sandstone', 'chiseled_red_sandstone', 'cut_red_sandstone', 'smooth_red_sandstone'],
  prismarine: ['prismarine', 'dark_prismarine', 'prismarine_bricks'],
  quartz_block: ['quartz_block', 'chiseled_quartz_block', 'quartz_pillar', 'smooth_quartz'],
  stonebrick: ['stone_bricks', 'mossy_stone_bricks', 'cracked_stone_bricks', 'chiseled_stone_bricks'],
  purpur_block: ['purpur_block', null, 'purpur_pillar'],
  cobblestone_wall: [
    'cobblestone_wall', 'mossy_cobblestone_wall', 'granite_wall', 'diorite_wall', 'andesite_wall', 'sandstone_wall', 'brick_wall',
    'stone_brick_wall', 'mossy_stone_brick_wall', 'nether_brick_wall', 'end_stone_brick_wall', 'prismarine_wall', 'red_sandstone_wall',
    'red_nether_brick_wall',
  ],
  stone_block_slab: ['smooth_stone_slab', 'sandstone_slab', 'oak_slab', 'cobblestone_slab', 'brick_slab', 'stone_brick_slab', 'quartz_slab', 'nether_brick_slab'],
  stone_block_slab2: ['red_sandstone_slab', 'purpur_slab', 'prismarine_slab', 'dark_prismarine_slab', 'prismarine_brick_slab', 'mossy_cobblestone_slab', 'smooth_sandstone_slab', 'red_nether_brick_slab'],
  stone_block_slab3: ['end_stone_brick_slab', 'smooth_red_sandstone_slab', 'polished_andesite_slab', 'andesite_slab', 'diorite_slab', 'polished_diorite_slab', 'granite_slab', 'polished_granite_slab'],
  stone_block_slab4: ['mossy_stone_brick_slab', 'smooth_quartz_slab', 'stone_slab', 'cut_sandstone_slab', 'cut_red_sandstone_slab'],
  double_plant: ['sunflower', 'lilac', 'tall_grass', 'large_fern', 'rose_bush', 'peony'],
  red_flower: ['poppy', 'blue_orchid', 'allium', 'azure_bluet', 'red_tulip', 'orange_tulip', 'white_tulip', 'pink_tulip', 'oxeye_daisy', 'cornflower', 'lily_of_the_valley'],
  skull: ['skeleton_skull', 'wither_skeleton_skull', 'zombie_head', 'player_head', 'creeper_head', 'dragon_head', 'piglin_head'],
  wooden_slab: WOODS.map((w) => `${w}_slab`),
  fence: WOODS.map((w) => `${w}_fence`),
  empty_map: ['map', null, 'empty_locator_map'],
  emptymap: ['map', null, 'empty_locator_map'],
  dye: DYES,
  banner: DYE_COLORS.map((c) => `${c}_banner`),
  bucket: ['bucket', 'milk_bucket', 'cod_bucket', 'salmon_bucket', 'tropical_fish_bucket', 'pufferfish_bucket', null, null, 'water_bucket', null, 'lava_bucket'],
  boat: ['oak_boat', 'spruce_boat', 'birch_boat', 'jungle_boat', 'acacia_boat', 'dark_oak_boat', 'mangrove_boat', 'bamboo_raft'],
  chest_boat: ['oak_chest_boat', 'spruce_chest_boat', 'birch_chest_boat', 'jungle_chest_boat', 'acacia_chest_boat', 'dark_oak_chest_boat', 'mangrove_chest_boat', 'bamboo_chest_raft'],
};

// Items that keep their id whatever their number says (a dropper's number is just which way it faces).
const IGNORE_NUMBER = new Set(['dropper', 'dispenser', 'piston', 'sticky_piston', 'observer', 'hopper', 'furnace', 'chest']);

// Plain renames, including ids that mean something different in Java (Bedrock "snow" is the snow block).
const renames = {
  brick_block: 'bricks', chain: 'iron_chain', end_brick_stairs: 'end_stone_brick_stairs', end_bricks: 'end_stone_bricks',
  fence_gate: 'oak_fence_gate', frame: 'item_frame', glow_frame: 'glow_item_frame', golden_rail: 'powered_rail',
  hardened_clay: 'terracotta', lit_pumpkin: 'jack_o_lantern', magma: 'magma_block', melon_block: 'melon',
  netherbrick: 'nether_brick', nether_brick: 'nether_bricks', red_nether_brick: 'red_nether_bricks',
  normal_stone_stairs: 'stone_stairs', stone_stairs: 'cobblestone_stairs', noteblock: 'note_block',
  prismarine_bricks_stairs: 'prismarine_brick_stairs', quartz_ore: 'nether_quartz_ore', scute: 'turtle_scute',
  silver_glazed_terracotta: 'light_gray_glazed_terracotta', slime: 'slime_block', snow: 'snow_block', snow_layer: 'snow',
  stonecutter_block: 'stonecutter', trapdoor: 'oak_trapdoor', undyed_shulker_box: 'shulker_box',
  waxed_copper: 'waxed_copper_block', web: 'cobweb', wooden_button: 'oak_button', wooden_door: 'oak_door',
  wooden_pressure_plate: 'oak_pressure_plate', yellow_flower: 'dandelion', lodestone_compass: null,
  normal_stone_slab: 'stone_slab', chorus_fruit_popped: 'popped_chorus_fruit',
  cooked_fish: 'cooked_cod', fish: 'cod', muttonCooked: 'cooked_mutton', muttonRaw: 'mutton', carrotonastick: 'carrot_on_a_stick',
  darkoak_sign: 'dark_oak_sign', sign: 'oak_sign', horsearmorleather: 'leather_horse_armor', horsearmorgold: 'golden_horse_armor',
  horsearmoriron: 'iron_horse_armor', horsearmordiamond: 'diamond_horse_armor', netherstar: 'nether_star', record_5: 'music_disc_5',
  sealantern: 'sea_lantern', speckled_melon: 'glistering_melon_slice', reeds: 'sugar_cane', turtle_shell_piece: 'turtle_scute',
  azalea_leaves_flowered: 'flowering_azalea_leaves', appleEnchanted: 'enchanted_golden_apple', clownfish: 'tropical_fish',
  fireball: 'fire_charge',
};

// Things the book leaves out: potion arrows, lingering potions, firework stars, stew variants, banners with patterns.
const dropped = new Set(['lingering_potion', 'firework_star', 'suspicious_stew', 'banner_pattern']);

// "wood" in old Bedrock: 0-5 are the six woods, add 8 for the stripped kind.
function wood(meta) {
  const kind = WOODS[meta & 7];
  if (!kind) return null;
  return meta & 8 ? `stripped_${kind}_wood` : `${kind}_wood`;
}

// Every thing one old Bedrock id can stand for ("stone_block_slab3" is eight different slabs).
export function variantsOf(fullName) {
  const name = String(fullName).replace(/^minecraft:/, '');
  return byNumber[name] ? byNumber[name].filter(Boolean) : [modernId(name, 0)].filter(Boolean);
}

// One Bedrock id plus its number, to today's id. Returns null for things the book leaves out.
export function modernId(fullName, metadata) {
  const [, name, inName] = /^(?:minecraft:)?([^:]+)(?::(\d+))?$/.exec(String(fullName));
  const meta = IGNORE_NUMBER.has(name) ? 0 : metadata ?? (inName === undefined ? 0 : Number(inName));
  if (dropped.has(name)) return null;
  if (name === 'arrow') return meta === 0 ? 'arrow' : null;
  if (name === 'wood') return wood(meta);
  if (byNumber[name]) return byNumber[name][meta] ?? null;
  if (name in renames) return renames[name];
  return name;
}
