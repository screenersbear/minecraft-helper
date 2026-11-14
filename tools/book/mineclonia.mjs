// Mineclonia's pictures (https://codeberg.org/mineclonia/mineclonia, based on Pixel Perfection, CC BY-SA 4.0), for
// the newer things Pixel Perfection CE doesn't have. Only its picture files are used, nothing from the game itself.
// Mineclonia's own table (tools/Conversion_Table.csv) says which of its files is which Minecraft picture.
import { existsSync, readFileSync, readdirSync, openSync, readSync, closeSync } from 'node:fs';
import { join } from 'node:path';

// Mineclonia's team found these still look very close to Mojang's own pictures (its issue 4386): left out.
const TOO_CLOSE = [/^mcl_copper_door/, /anti_oxidation_particle/, /\/mcl_lightning_rods\//];

// Pictures the table doesn't list, found by hand: Minecraft's "<folder>/<name>" -> Mineclonia's file name.
const COPPER_AGES = ['exposed', 'weathered', 'oxidized'];
const BY_HAND = {
  'item/copper_axe': 'mcl_copper_tool_axe', 'item/copper_hoe': 'mcl_copper_tool_hoe', 'item/copper_pickaxe': 'mcl_copper_tool_pick',
  'item/copper_shovel': 'mcl_copper_tool_shovel', 'item/copper_sword': 'mcl_copper_tool_sword',
  'item/copper_helmet': 'mcl_armor_inv_helmet_copper', 'item/copper_chestplate': 'mcl_armor_inv_chestplate_copper',
  'item/copper_leggings': 'mcl_armor_inv_leggings_copper', 'item/copper_boots': 'mcl_armor_inv_boots_copper',
  'item/copper_horse_armor': 'mcl_mobitems_copper_horse_armor', 'item/copper_nugget': 'mcl_copper_nugget',
  'item/copper_torch': 'mcl_copper_torch', 'item/copper_lantern': 'mcl_copper_lantern_inv', 'item/copper_chain': 'mcl_copper_chain_inv',
  'block/copper_bars': 'mcl_copper_pane',
  ...Object.fromEntries(COPPER_AGES.flatMap((age) => [
    [`item/${age}_copper_lantern`, `mcl_copper_lantern_${age}_inv`],
    [`item/${age}_copper_chain`, `mcl_copper_chain_${age}_inv`],
  ])),
  'item/pale_oak_door': 'mcl_pale_oak_door_item', 'block/pale_oak_trapdoor': 'mcl_pale_oak_trapdoor',
  'block/pale_oak_log': 'mcl_pale_oak_log', 'block/stripped_pale_oak_log': 'mcl_stripped_pale_oak_log_side',
  'item/pale_oak_boat': 'mcl_boats_pale_oak_boat', 'item/pale_oak_chest_boat': 'mcl_boats_pale_oak_chest_boat',
  'block/pale_moss_block': 'mcl_pale_oak_moss', 'block/open_eyeblossom': 'mcl_pale_oak_eyeblossom_open',
  'block/closed_eyeblossom': 'mcl_pale_oak_eyeblossom',
  'block/resin_block': 'mcl_pale_oak_resin_block', 'block/resin_bricks': 'mcl_pale_oak_resin_brick_block',
  'block/chiseled_resin_bricks': 'mcl_pale_oak_chiseled_resin_bricks', 'item/resin_brick': 'mcl_pale_oak_resin_brick',
  'item/resin_clump': 'mcl_pale_oak_resin_clump',
  'block/leaf_litter': 'mcl_flowers_leaf_litter', 'block/cactus_flower': 'cactus_flower', 'block/dripstone_block': 'dripstone_block',
  'item/pointed_dripstone': 'pointed_dripstone_tip', 'block/heavy_core': 'mcl_tools_heavy_core_side',
};

// A plain square picture (or a strip of animation frames), at least 16 wide: the atlas can use it as it is.
function usableSize(path) {
  const fd = openSync(path, 'r');
  const head = Buffer.alloc(24);
  readSync(fd, head, 0, 24, 0);
  closeSync(fd);
  const width = head.readUInt32BE(16);
  const height = head.readUInt32BE(20);
  return width >= 16 && width % 16 === 0 && height % width === 0;
}

// Returns file(folder, name): the path of Mineclonia's picture for Minecraft's "<folder>/<name>.png", or null.
// root: the downloaded copy of Mineclonia (.cache/mineclonia). Without it, every answer is null.
export function minecloniaFiles(root) {
  const tablePath = join(root, 'tools/Conversion_Table.csv');
  const table = new Map();
  if (existsSync(tablePath)) {
    for (const line of readFileSync(tablePath, 'utf8').split('\n').slice(1)) {
      const [fromPath, fromFile, toPath, toFile, cropX, , , , , , blacklisted] = line.split(',');
      // Rows with a crop are pieces of a bigger sheet; blacklisted rows aren't used by Mineclonia either.
      if (!fromFile || cropX || (blacklisted || '').trim() === 'y') continue;
      const path = join(root, toPath, toFile);
      if (TOO_CLOSE.some((r) => r.test(toFile) || r.test(`${toPath}/`))) continue;
      if (!existsSync(path) || !usableSize(path)) continue;
      const folder = fromPath.replace('/assets/minecraft/textures/', '');
      table.set(`${folder}/${fromFile}`, path);
    }
  }
  // Every Mineclonia picture by file name, for the ones found by hand.
  const byName = new Map();
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.name.endsWith('.png') && path.includes('/textures/')) byName.set(entry.name.slice(0, -4), path);
    }
  };
  if (existsSync(join(root, 'mods'))) walk(join(root, 'mods'));
  for (const [key, name] of Object.entries(BY_HAND)) {
    const path = byName.get(name);
    if (path && usableSize(path) && !table.has(`${key}.png`)) table.set(`${key}.png`, path);
  }
  return (folder, name) => table.get(`${folder}/${name}.png`) || null;
}
