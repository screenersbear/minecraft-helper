// More facts for the book: biomes (does it rain or snow there), enchantments (what they do, what they go on, how
// high they go), potion effects, and how much each food fills you. Numbers and names come from minecraft-data; what
// things do, in plain words, comes from explain.json.

// Java's biome names, and the name the same biome has in Bedrock's data, where it's different.
// Bedrock's own numbers decide the weather: a few biomes rain in one game and not the other.
const BEDROCK_NAME = {
  badlands: 'mesa', eroded_badlands: 'mesa_bryce', wooded_badlands: 'mesa_plateau_stone', nether_wastes: 'hell',
  soul_sand_valley: 'soulsand_valley', snowy_plains: 'ice_plains', ice_spikes: 'ice_plains_spikes', snowy_taiga: 'cold_taiga',
  old_growth_pine_taiga: 'mega_taiga', old_growth_spruce_taiga: 'redwood_taiga_mutated', windswept_hills: 'extreme_hills',
  windswept_gravelly_hills: 'extreme_hills_mutated', windswept_forest: 'extreme_hills_plus_trees',
  windswept_savanna: 'savanna_mutated', dark_forest: 'roofed_forest', mushroom_fields: 'mushroom_island', swamp: 'swampland',
  stony_shore: 'stone_beach', snowy_beach: 'cold_beach', sparse_jungle: 'jungle_edge', old_growth_birch_forest: 'birch_forest_mutated',
};
// Biomes that are only in Java, or only a piece of a bigger one in Bedrock (the End is one biome there).
const NOT_IN_BEDROCK = new Set(['the_void', 'end_barrens', 'end_highlands', 'end_midlands', 'small_end_islands']);
// The snowy biome next to a plain one, for "does it snow in a taiga": "in a snowy taiga, it does".
const SNOWY_KIN = { taiga: 'snowy_taiga', plains: 'snowy_plains', beach: 'snowy_beach', ocean: 'frozen_ocean', deep_ocean: 'deep_frozen_ocean', river: 'frozen_river' };

// Snow falls where it's colder than 0.15. Up to 0.3, it rains low down and snows way up high (minecraft.wiki: Taiga).
function weatherOf(pc, bedrock) {
  if (pc.category === 'underground') return 'cave';
  const rains = bedrock ? bedrock.has_precipitation : pc.has_precipitation;
  const temperature = bedrock ? bedrock.temperature : pc.temperature;
  if (!rains) return 'dry';
  if (temperature < 0.15) return 'snow';
  if (temperature < 0.3) return 'rain-snow-high';
  return 'rain';
}

export function buildBiomes(pcBiomes, bedrockBiomes, explain) {
  const bedrockByName = new Map(bedrockBiomes.map((b) => [b.name, b]));
  const biomes = {};
  for (const b of pcBiomes) {
    if (NOT_IN_BEDROCK.has(b.name)) continue;
    const bedrock = bedrockByName.get(BEDROCK_NAME[b.name] || b.name);
    biomes[b.name] = {
      name: b.displayName,
      world: b.dimension,
      weather: weatherOf(b, bedrock),
      pic: explain.biomePictures[b.name] || null,
      also: explain.biomeNames[b.name] || [],
    };
    if (SNOWY_KIN[b.name]) biomes[b.name].snowy = SNOWY_KIN[b.name];
  }
  return biomes;
}

// Enchantments, minus the one Bedrock doesn't have (Sweeping Edge) and any without words in explain.json.
export function buildEnchants(pcEnchants, explain) {
  const enchants = {};
  for (const e of pcEnchants) {
    const what = explain.enchantments[e.name];
    if (!what) continue;
    enchants[e.name] = { name: e.displayName, what, max: e.maxLevel, on: explain.goesOn[e.category] || 'some things', pic: 'enchanted_book' };
    if (e.curse) enchants[e.name].curse = true;
    if (e.treasureOnly && !e.curse) enchants[e.name].treasure = true;
  }
  return enchants;
}

// "MiningFatigue" -> "mining_fatigue".
const snake = (name) => name.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();

// Potion effects, minus Java-only ones (Glowing, Luck): they have no words in explain.json.
export function buildEffects(pcEffects, explain) {
  const effects = {};
  for (const e of pcEffects) {
    const id = snake(e.name);
    const what = explain.effects[id];
    if (!what) continue;
    effects[id] = { name: e.displayName, what, good: e.type === 'good', pic: 'potion', also: explain.effectNames[id] || [] };
  }
  return effects;
}

// How much each food fills: points are half drumsticks on the hunger bar. "full" says how long it keeps you full.
// Buckets of fish are in the food list by mistake: you can't eat them.
export function buildFoods(pcFoods, explain) {
  const foods = {};
  for (const f of pcFoods) {
    if (f.name.endsWith('_bucket')) continue;
    const ratio = f.saturation / f.foodPoints;
    const food = { points: f.foodPoints };
    if (ratio >= 1.2) food.full = 'long';
    if (ratio <= 0.2) food.full = 'short';
    if (explain.foods[f.name]) food.note = explain.foods[f.name];
    foods[f.name] = food;
  }
  return foods;
}

// The best everyday foods, best first: they fill the most and keep you full longest. Foods that hurt you,
// soups (one per slot) and golden apples (for healing, not for meals) are left out.
export function bestFoods(pcFoods, explain, count = 6) {
  return pcFoods
    .filter((f) => f.stackSize === 64 && !explain.foods[f.name]?.match(/poison|hungry|sick/) && !f.name.includes('golden_apple'))
    .sort((a, b) => b.foodPoints + b.saturation - (a.foodPoints + a.saturation))
    .slice(0, count)
    .map((f) => f.name);
}

// Topics: answers that aren't about one thing, like "what's the best food".
export function buildTopics(pcFoods, explain) {
  const topics = {};
  for (const [id, t] of Object.entries(explain.topics)) topics[id] = { ...t };
  if (topics['best-food']) topics['best-food'].foods = bestFoods(pcFoods, explain);
  return topics;
}

// Every item the new facts show a picture of, so the picture sheet includes them.
export function extraPictures(biomes, enchants, effects, topics) {
  const ids = new Set(['enchanted_book', 'potion', 'grass_block', 'netherrack', 'end_stone', 'water_bucket', 'snowball', 'sand', 'stone']);
  for (const b of Object.values(biomes)) if (b.pic) ids.add(b.pic);
  for (const t of Object.values(topics)) {
    if (t.pic) ids.add(t.pic);
    (t.foods || []).forEach((f) => ids.add(f));
  }
  for (const x of [...Object.values(enchants), ...Object.values(effects)]) if (x.pic) ids.add(x.pic);
  return ids;
}
