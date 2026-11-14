// Facts for things you can't craft, and for mobs: which mobs drop it, which blocks you mine for it,
// what pickaxe a block needs, and whether a mob is friendly. All from minecraft-data's Java loot and block tables.

// Mobs the wiki calls neutral: they only attack if you make them angry. The data only says passive or hostile.
const NEUTRAL = new Set([
  'bee', 'dolphin', 'enderman', 'goat', 'iron_golem', 'llama', 'trader_llama', 'panda', 'piglin', 'polar_bear', 'wolf', 'zombified_piglin',
]);
const BOSSES = new Set(['ender_dragon', 'wither', 'elder_guardian', 'warden']);

// Mobs most kids meet first are listed first when several drop the same thing.
const COMMON = ['cow', 'chicken', 'pig', 'sheep', 'spider', 'skeleton', 'zombie', 'creeper', 'rabbit', 'squid', 'horse', 'witch', 'ghast', 'enderman', 'slime', 'blaze'];
const byCommon = (a, b) => (COMMON.indexOf(a) + 1 || 99) - (COMMON.indexOf(b) + 1 || 99);

const isJunkDrop = (item) => /^music_disc|_head$|_skull$|^air$/.test(item);

// Blocks you don't break to get things in normal play: a pot gives back its plant, a candle cake its candle,
// an ender chest the obsidian it was made from. Leaving them out keeps the facts to the usual way to get things.
const ODD_SOURCE = /^potted_|candle_cake$|_cauldron$|^attached_|_stem$|^(tall|large)_|campfire$|_coral_block$|^(ender_chest|composter|redstone_wire|tripwire|dirt_path|farmland|snow)$/;

// The weakest pickaxe (or other tool) that can mine a block, from its harvestTools list.
const TIERS = ['wooden', 'golden', 'stone', 'copper', 'iron', 'diamond', 'netherite'];
function weakestTool(harvestTools, nameOf) {
  if (!harvestTools) return null;
  const tools = Object.keys(harvestTools).map((id) => nameOf(Number(id))).filter(Boolean);
  const picks = tools.filter((t) => t.endsWith('_pickaxe'));
  const list = picks.length ? picks : tools;
  list.sort((a, b) => TIERS.findIndex((t) => a.startsWith(t)) - TIERS.findIndex((t) => b.startsWith(t)));
  return list[0] || null;
}

// sources: { entityLoot, blockLoot, javaBlocks, javaItems, javaEntities }. known: ids the book has.
export function buildFacts(sources, known) {
  const nameOf = (id) => sources.javaItems.find((i) => i.id === id)?.name;
  const facts = {};
  const fact = (id) => (facts[id] ||= {});

  // Mobs: kind and drops.
  for (const e of sources.javaEntities) {
    if (e.category !== 'Passive mobs' && e.category !== 'Hostile mobs') continue;
    const loot = sources.entityLoot.find((l) => l.entity === e.name);
    const drops = (loot?.drops || []).filter((d) => d.dropChance >= 0.3 && !isJunkDrop(d.item)).map((d) => d.item);
    let kind = e.category === 'Hostile mobs' ? 'hostile' : 'passive';
    if (NEUTRAL.has(e.name)) kind = 'neutral';
    if (BOSSES.has(e.name)) kind = 'boss';
    fact(e.name).mob = { kind, drops: [...new Set(drops)] };
    for (const item of new Set(drops)) (fact(item).fromMobs ||= []).push(e.name);
  }
  for (const f of Object.values(facts)) if (f.fromMobs) f.fromMobs = f.fromMobs.sort(byCommon).slice(0, 3);

  // Blocks: what you mine for things, and which tool a block needs.
  // The loot table splits each block's chances between mining with silk touch and without, so diamond ore says
  // "diamond 0.5". Only the drops without silk touch count, scaled so they add up to 1, and the same item listed
  // twice (carrots) is added together.
  const sourceBlocks = new Set();
  for (const loot of sources.blockLoot) {
    // The loot table is from Java 1.20, before "grass" was renamed "short grass".
    const b = loot.block === 'grass' ? { ...loot, block: 'short_grass' } : loot;
    if (ODD_SOURCE.test(b.block)) continue;
    const normal = b.drops.filter((d) => !d.silkTouch);
    const total = normal.reduce((sum, d) => sum + d.dropChance, 0) || 1;
    const chances = new Map();
    for (const d of normal) chances.set(d.item, (chances.get(d.item) || 0) + d.dropChance / total);
    for (const [item, chance] of chances) {
      if (item === b.block || isJunkDrop(item) || chance < 0.05) continue;
      (fact(item).fromBlocks ||= []).push({ block: b.block, sometimes: chance < 0.99 });
      sourceBlocks.add(b.block);
    }
  }
  for (const f of Object.values(facts)) {
    if (f.fromBlocks) f.fromBlocks = f.fromBlocks.sort((a, b) => a.block.startsWith('deepslate_') - b.block.startsWith('deepslate_')).slice(0, 3);
  }
  for (const b of sources.javaBlocks) {
    const tool = weakestTool(b.harvestTools, nameOf);
    if (tool && (known.has(b.name) || sourceBlocks.has(b.name))) fact(b.name).mineWith = tool;
  }
  return facts;
}
