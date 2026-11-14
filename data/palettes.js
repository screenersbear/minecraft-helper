// Block palettes: sets of blocks that look good together, for building in a style. Every block is easy to get in
// Survival. The first block is the main one (walls), then the trim, the floor or roof, and a light or a detail.
// Remix swaps a build's blocks for a palette's, in that order. Challenges suggest one.
export const PALETTES = [
  { id: 'cozy-cabin', name: 'Cozy cabin', about: 'Warm wood and stone, like a cabin in the woods.', blocks: ['spruce_planks', 'oak_log', 'cobblestone', 'spruce_stairs', 'lantern'] },
  { id: 'ocean', name: 'Ocean', about: 'Sea greens and glass, like a sunken temple.', blocks: ['prismarine_bricks', 'dark_prismarine', 'sand', 'glass', 'sea_lantern'] },
  { id: 'candy', name: 'Candy', about: 'Bright soft colours, like a sweet shop.', blocks: ['pink_wool', 'white_wool', 'light_blue_wool', 'yellow_wool', 'lantern'] },
  { id: 'forest', name: 'Forest', about: 'Logs, leaves and moss, like it grew there.', blocks: ['oak_log', 'oak_planks', 'moss_block', 'mossy_cobblestone', 'oak_leaves'] },
  { id: 'desert', name: 'Desert', about: 'Sand colours that look great in the sun.', blocks: ['sandstone', 'smooth_sandstone', 'terracotta', 'orange_terracotta', 'acacia_planks'] },
  { id: 'spooky', name: 'Spooky', about: 'Dark wood and pumpkins. Not too scary.', blocks: ['dark_oak_planks', 'dark_oak_log', 'mossy_cobblestone', 'cobweb', 'jack_o_lantern'] },
  { id: 'snowy', name: 'Snowy', about: 'Snow and ice with dark wood for warmth.', blocks: ['snow_block', 'spruce_planks', 'spruce_log', 'packed_ice', 'lantern'] },
  { id: 'castle', name: 'Castle', about: 'Old stone, some of it mossy and cracked.', blocks: ['stone_bricks', 'cobblestone', 'mossy_stone_bricks', 'cracked_stone_bricks', 'oak_planks'] },
  { id: 'town', name: 'Town', about: 'Brick and wood, like a street of shops.', blocks: ['bricks', 'spruce_planks', 'smooth_stone', 'glass', 'white_wool'] },
  { id: 'fairy', name: 'Fairy', about: 'Pink blossom and moss, soft and magic.', blocks: ['cherry_planks', 'cherry_log', 'moss_block', 'cherry_leaves', 'pink_wool'] },
];

export const paletteById = (id) => PALETTES.find((p) => p.id === id) || null;
