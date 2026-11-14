// Mob pictures: each is the front of the mob's head, cut from its Pixel Perfection CE skin.
// Numbers are x, y, width, height on the skin (the same layout as the game's models).
const F = (file, x, y, w, h) => ({ file: `entity/${file}.png`, crop: { x, y, w, h } });

export const FACES = {
  zombie: F('zombie/zombie', 8, 8, 8, 8),
  husk: F('zombie/husk', 8, 8, 8, 8),
  drowned: F('zombie/drowned', 8, 8, 8, 8),
  skeleton: F('skeleton/skeleton', 8, 8, 8, 8),
  stray: F('skeleton/stray', 8, 8, 8, 8),
  wither_skeleton: F('skeleton/wither_skeleton', 8, 8, 8, 8),
  creeper: F('creeper/creeper', 8, 8, 8, 8),
  enderman: F('enderman/enderman', 8, 8, 8, 8),
  spider: F('spider/spider', 40, 12, 8, 8),
  cave_spider: F('spider/cave_spider', 40, 12, 8, 8),
  pig: F('pig/pig', 8, 8, 8, 8),
  cow: F('cow/cow', 6, 6, 8, 8),
  mooshroom: F('cow/red_mooshroom', 6, 6, 8, 8),
  sheep: F('sheep/sheep', 8, 8, 6, 6),
  wolf: F('wolf/wolf', 4, 4, 6, 6),
  cat: F('cat/tabby', 5, 5, 5, 4),
  ocelot: F('cat/ocelot', 5, 5, 5, 4),
  villager: F('villager/villager', 8, 8, 8, 10),
  witch: F('witch', 8, 8, 8, 10),
  iron_golem: F('iron_golem/iron_golem', 8, 8, 8, 10),
  slime: F('slime/slime', 8, 8, 8, 8),
  magma_cube: F('slime/magmacube', 8, 8, 8, 8),
  blaze: F('blaze', 8, 8, 8, 8),
  ghast: F('ghast/ghast', 16, 16, 16, 16),
  piglin: F('piglin/piglin', 8, 8, 10, 8),
  zombified_piglin: F('piglin/zombified_piglin', 8, 8, 10, 8),
  chicken: F('chicken', 3, 3, 4, 6),
  snow_golem: F('snow_golem', 8, 8, 8, 8),
};
