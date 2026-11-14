// Finds the Pixel Perfection CE picture for an item or block id, and says how to treat it:
// which file, an optional shape to cut it to (stairs, slab...), and an optional colour for grey textures (leaves, water).
import { existsSync } from 'node:fs';
import { join } from 'node:path';

// Pixel Perfection CE stops at Minecraft 1.18 and some names changed since.
const RENAMED = {
  iron_chain: 'chain', short_grass: 'grass', turtle_scute: 'scute', water: 'water_still', lava: 'lava_still',
  filled_map: 'filled_map', farmland: 'farmland_moist', dirt_path: 'grass_path_top', magma_block: 'magma',
  snow_block: 'snow', smooth_quartz: 'quartz_block_bottom', smooth_sandstone: 'sandstone_top',
  smooth_red_sandstone: 'red_sandstone_top', compass: 'compass_00', clock: 'clock_00', crossbow: 'crossbow_standby',
  sticky_piston: 'piston_top_sticky', enchanted_golden_apple: 'golden_apple', carrots: 'carrot', potatoes: 'potato',
  beetroots: 'beetroot', cocoa: 'cocoa_beans', redstone_wire: 'redstone', sweet_berry_bush: 'sweet_berries',
  water_cauldron: 'cauldron', lava_cauldron: 'cauldron', powder_snow_cauldron: 'cauldron', dried_kelp_block: 'dried_kelp_side',
  candle_cake: 'cake', empty_locator_map: 'map', recovery_compass: null,
};

// Things drawn as a model in the game: cut a picture from the pack's model skin instead (x, y, width, height).
const crop = (file, x, y, w, h, tint) => ({ file: `entity/${file}.png`, crop: { x, y, w, h }, tint });
const MODELS = {
  chest: crop('chest/normal', 14, 33, 14, 10), trapped_chest: crop('chest/trapped', 14, 33, 14, 10),
  ender_chest: crop('chest/ender', 14, 33, 14, 10), creeper_head: crop('creeper/creeper', 8, 8, 8, 8),
  wither_skeleton_skull: crop('skeleton/wither_skeleton', 8, 8, 8, 8), skeleton_skull: crop('skeleton/skeleton', 8, 8, 8, 8),
  zombie_head: crop('zombie/zombie', 8, 8, 8, 8),
};
const DYE_HEX = {
  white: '#F9FFFE', orange: '#F9801D', magenta: '#C74EBD', light_blue: '#3AB3DA', yellow: '#FED83D', lime: '#80C71F',
  pink: '#F38BAA', gray: '#474F52', light_gray: '#9D9D97', cyan: '#169C9C', purple: '#8932B8', blue: '#3C44AA',
  brown: '#835432', green: '#5E7C16', red: '#B02E26', black: '#1D1D21',
};
// Newer woods the pack doesn't have: oak's picture, recoloured to that wood.
const NEW_WOODS = { cherry: '#E2B2AA', mangrove: '#8A4234', pale_oak: '#E6DCD8', bamboo: '#D4BF5A' };

// Grey textures the game colours in. Colours are the usual plains greens.
const TINTS = {
  oak_leaves: '#48B518', jungle_leaves: '#48B518', acacia_leaves: '#48B518', dark_oak_leaves: '#48B518', mangrove_leaves: '#48B518',
  spruce_leaves: '#619961', birch_leaves: '#80A755', vine: '#48B518', lily_pad: '#208030', grass: '#91BD59', tall_grass: '#91BD59',
  fern: '#91BD59', large_fern: '#91BD59', grass_block_top: '#91BD59', water_still: '#3F76E4', redstone_dust_dot: '#FF0000',
};

// Shapes cut from a full block texture, as 16 rows of 16 (1 = keep).
const shape = (rows) => rows.map((r) => [...r].map((c) => c === '#'));
const FULL = '################';
const NONE = '................';
export const SHAPES = {
  stairs: shape([...Array(8).fill('........########'), ...Array(8).fill(FULL)]),
  slab: shape([...Array(8).fill(NONE), ...Array(8).fill(FULL)]),
  carpet: shape([...Array(13).fill(NONE), ...Array(3).fill(FULL)]),
  plate: shape([...Array(13).fill(NONE), ...Array(2).fill('.##############.'), NONE]),
  button: shape([...Array(6).fill(NONE), ...Array(4).fill('.....######.....'), ...Array(6).fill(NONE)]),
  fence: shape([
    ...Array(2).fill('..####....####..'), ...Array(3).fill('################'), ...Array(3).fill('..####....####..'),
    ...Array(3).fill('################'), ...Array(5).fill('..####....####..'),
  ]),
  wall: shape([
    ...Array(3).fill(NONE), ...Array(3).fill('..####....####..'), ...Array(10).fill('################'),
  ]),
  pane: shape(Array(16).fill('.......##.......')),
};

const SUFFIX_SHAPES = [
  ['_stairs', 'stairs'], ['_slab', 'slab'], ['_carpet', 'carpet'], ['_pressure_plate', 'plate'], ['_button', 'button'],
  ['_fence_gate', 'fence'], ['_fence', 'fence'], ['_wall', 'wall'],
];

// Material names for shaped blocks: "stone_brick_stairs" -> stone_bricks, "oak_slab" -> oak_planks.
function materialCandidates(base) {
  const special = {
    smooth_stone: ['smooth_stone'], quartz: ['quartz_block_side'], smooth_quartz: ['quartz_block_bottom'],
    sandstone: ['sandstone'], red_sandstone: ['red_sandstone'], smooth_sandstone: ['sandstone_top'], smooth_red_sandstone: ['red_sandstone_top'],
    cut_sandstone: ['cut_sandstone'], cut_red_sandstone: ['cut_red_sandstone'], purpur: ['purpur_block'], petrified_oak: ['oak_planks'],
    light_weighted: ['gold_block'], heavy_weighted: ['iron_block'], nether_brick: ['nether_bricks'], red_nether_brick: ['red_nether_bricks'],
    end_stone_brick: ['end_stone_bricks'], prismarine_brick: ['prismarine_bricks'], blackstone: ['blackstone'],
  };
  if (special[base]) return special[base];
  if (base.endsWith('_carpet')) return [`${base.replace('_carpet', '')}_wool`];
  return [base, `${base}s`, `${base}_planks`, `${base}_block`, `${base}_wool`];
}

// The picture for an id: { file, shape?, tint? } or null when Pixel Perfection CE has none.
export function textureFor(id, root) {
  const tex = join(root, 'assets/minecraft/textures');
  const file = (folder, name) => {
    const p = join(tex, folder, `${name}.png`);
    return existsSync(p) ? p : null;
  };
  if (RENAMED[id] === null) return null;
  const named = RENAMED[id] || id;
  if (MODELS[id]) return { ...MODELS[id], file: join(tex, MODELS[id].file) };
  const bed = /^(.+)_bed$/.exec(id);
  if (bed && DYE_HEX[bed[1]] && file('entity', `bed/${bed[1]}`)) return { file: file('entity', `bed/${bed[1]}`), crop: { x: 6, y: 6, w: 16, h: 16 } };
  const banner = /^(.+)_banner$/.exec(id);
  if (banner && DYE_HEX[banner[1]]) return { file: join(tex, 'entity/banner_base.png'), crop: { x: 1, y: 1, w: 20, h: 40 }, tint: DYE_HEX[banner[1]] };
  const wood = /^(cherry|mangrove|pale_oak|bamboo)_(planks|stairs|slab|fence|fence_gate|button|pressure_plate)$/.exec(id);
  if (wood) {
    const oak = textureFor(`oak_${wood[2]}`, root);
    return oak && { ...oak, recolor: NEW_WOODS[wood[1]] };
  }
  if (id.startsWith('potted_')) return textureFor(id.replace('potted_', ''), root);
  const tinted = (p, name) => ({ file: p, tint: TINTS[name] });
  for (const name of [named]) {
    const p = file('item', name) || file('block', name);
    if (p) return tinted(p, name);
  }
  for (const side of ['_front', '_side', '_top', '_still']) {
    const p = file('block', `${named}${side}`);
    if (p) return tinted(p, `${named}${side}`);
  }
  if (id.startsWith('waxed_')) return textureFor(id.replace('waxed_', ''), root);
  if (/_wood$/.test(id)) return textureFor(id.replace(/_wood$/, '_log'), root);
  if (/_hyphae$/.test(id)) return textureFor(id.replace(/_hyphae$/, '_stem'), root);
  for (const [suffix, cut] of SUFFIX_SHAPES) {
    if (!id.endsWith(suffix)) continue;
    const base = id.slice(0, -suffix.length);
    for (const m of materialCandidates(suffix === '_carpet' ? `${base}_carpet` : base)) {
      const p = file('block', m);
      if (p) return { file: p, shape: cut, tint: TINTS[m] };
    }
  }
  return null;
}
