// Builds the app's book: data/book.json (recipes, facts, names) and images/items.png (every picture in one image).
// Needs the downloaded sources in .cache/ (run `npm run fetch-sources` once first).
// Run: npm run build
import { readFileSync, writeFileSync, readdirSync, existsSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildRecipes } from './book/recipes.mjs';
import { isUnpack } from './book/crafting.mjs';
import { buildFacts } from './book/facts.mjs';
import { namer, mobName, familyNote, familyPicture } from './book/names.mjs';
import { textureFor } from './book/textures.mjs';
import { minecloniaFiles } from './book/mineclonia.mjs';
import { FACES } from './book/faces.mjs';
import { writeAtlas } from './book/atlas.mjs';
import { buildBiomes, buildEnchants, buildEffects, buildFoods, buildTopics, extraPictures } from './book/extras.mjs';
import { buildPalette } from './book/palette.mjs';
import { buildCategories } from './book/categories.mjs';
import { buildWhere } from './book/where.mjs';

const app = join(dirname(fileURLToPath(import.meta.url)), '..');
const data = join(app, '.cache/minecraft-data');
const pack = join(app, '.cache/ppce');
const moreFiles = minecloniaFiles(join(app, '.cache/mineclonia'));
const json = (p) => JSON.parse(readFileSync(join(data, p), 'utf8'));

const sources = {
  javaItems: json('pc/26.1/items.json'),
  javaRecipes: json('pc/26.1/recipes.json'),
  bedrockOld: json('bedrock/1.19.10/recipes.json'),
  javaBlocks: json('pc/26.1/blocks.json'),
  javaEntities: json('pc/26.1/entities.json'),
  entityLoot: json('pc/1.20/entityLoot.json'),
  blockLoot: json('pc/1.20/blockLoot.json'),
  bedrockItems: json('bedrock/1.26.60/items.json'),
  javaBiomes: json('pc/26.1/biomes.json'),
  bedrockBiomes: json('bedrock/1.21.60/biomes.json'),
  javaEnchants: json('pc/26.1/enchantments.json'),
  javaFoods: json('pc/26.1/foods.json'),
  javaEffects: json('pc/26.1/effects.json'),
};
const nameOf = namer([...sources.javaItems, ...sources.javaBlocks]);

// 1. Recipes, all from minecraft-data. Only things in the released game (Java 26.1 has them too).
const released = new Set(sources.javaItems.map((i) => i.name));
const { recipes, review } = buildRecipes(sources, released, join(app, 'tools/book/bedrock-fixes.json'));
for (const list of Object.values(recipes)) for (const r of list) if (r.how === 'crafting' && isUnpack(r)) r.unpack = true;
for (const list of Object.values(recipes)) for (const r of list) delete r.makes;

// 2. Everything the book mentions: things made, things used, guide pictures.
const used = new Set(Object.keys(recipes));
const cellIds = (cell) => (cell ? cell.split('|') : []);
for (const list of Object.values(recipes)) {
  for (const r of list) {
    for (const c of [...(r.grid || []).flat(), r.input, ...(r.slots || []), ...(r.back || []).map((b) => b[0])]) cellIds(c).forEach((x) => used.add(x));
  }
}
const guideDir = join(app, 'guides');
const guideIds = new Set();
for (const f of readdirSync(guideDir).filter((x) => x.endsWith('.json'))) {
  const g = JSON.parse(readFileSync(join(guideDir, f), 'utf8'));
  guideIds.add(g.id);
  used.add(g.picture);
  for (const s of g.steps) {
    if (s.item) used.add(s.item);
    for (const v of Object.values(s.key || {})) used.add(v);
  }
}

// 3. Facts. Things you can't craft but can get from mobs or mining join the book too.
const inBedrock = new Set(sources.bedrockItems.map((i) => i.name));
const allFacts = buildFacts(sources, used);
const facts = {};
const mobs = {};
// Not in Bedrock (the giant, the illusioner), or not really a mob (an End crystal).
const NOT_MOBS = new Set(['giant', 'illusioner', 'end_crystal']);
for (const [id, f] of Object.entries(allFacts)) {
  if (f.mob && mobName(sources.javaEntities, id) && !NOT_MOBS.has(id)) mobs[id] = { name: mobName(sources.javaEntities, id), ...f.mob };
  const fromMobs = f.fromMobs?.filter((m) => !NOT_MOBS.has(m));
  const item = { fromMobs: fromMobs?.length ? fromMobs : undefined, fromBlocks: f.fromBlocks, mineWith: f.mineWith };
  const useful = item.fromMobs || item.fromBlocks || item.mineWith;
  if (useful && nameOf(id) && (used.has(id) || inBedrock.has(id))) {
    facts[id] = Object.fromEntries(Object.entries(item).filter(([, v]) => v));
    used.add(id);
  }
}
for (const m of Object.values(mobs)) m.drops.forEach((d) => used.add(d));
for (const f of Object.values(facts)) (f.fromBlocks || []).forEach((b) => used.add(b.block));

// 3b. More facts: biomes, enchantments, potion effects, food, and the block colours for pixel art.
const explain = JSON.parse(readFileSync(join(app, 'tools/book/explain.json'), 'utf8'));
const biomes = buildBiomes(sources.javaBiomes, sources.bedrockBiomes, explain);
const enchants = buildEnchants(sources.javaEnchants, explain);
const effects = buildEffects(sources.javaEffects, explain);
const topics = buildTopics(sources.javaFoods, explain);
for (const [id, food] of Object.entries(buildFoods(sources.javaFoods, explain))) {
  if (!nameOf(id)) continue;
  facts[id] = { ...facts[id], food };
  used.add(id);
}
const palette = buildPalette(pack);
for (const id of [...extraPictures(biomes, enchants, effects, topics), ...palette.map((p) => p.id)]) if (nameOf(id)) used.add(id);

// 3c. Where to find things (where.json): every mob, plus ores, rare items and structures.
const found = buildWhere(join(app, 'tools/book/where.json'), nameOf, mobs, guideIds);
found.ids.forEach((id) => used.add(id));

// 4. Names and pictures.
const specs = [];
const specIndex = new Map();
const pictureIndex = (spec) => {
  if (!spec) return -1;
  const key = JSON.stringify(spec);
  if (!specIndex.has(key)) {
    specIndex.set(key, specs.length);
    specs.push(spec);
  }
  return specIndex.get(key);
};
const exists = (id) => Boolean(nameOf(id));
const items = {};
const noPicture = [];
const noName = [];
for (const id of [...used].sort()) {
  const name = nameOf(id);
  if (!name) {
    noName.push(id);
    continue;
  }
  const picId = id.startsWith('@') ? familyPicture(id, exists) : id;
  const pic = pictureIndex(picId && textureFor(picId, pack, moreFiles));
  if (pic < 0) noPicture.push(id);
  items[id] = { name, pic };
  const note = id.startsWith('@') ? familyNote(id) || 'any colour' : null;
  if (note) items[id].note = note;
}
for (const [id, mob] of Object.entries(mobs)) {
  const face = FACES[id];
  const file = face && (face.mineclonia ? join(app, '.cache/mineclonia/mods/ENTITIES/mobs_mc/textures', face.mineclonia) : join(pack, 'assets/minecraft/textures', face.file));
  mob.pic = face && existsSync(file) ? pictureIndex({ ...face, file }) : -1;
}

// 4b. The book's pages (Tools, Food...): what's in each.
const answerable = (id) => (recipes[id] || []).some((r) => !r.unpack) || Boolean(facts[id]);
const blockIds = new Set(sources.javaBlocks.map((b) => b.name));
const foodIds = new Set(sources.javaFoods.map((f) => f.name));
const categories = buildCategories(items, answerable, blockIds, mobs, foodIds);

// 5. Write everything.
const atlas = writeAtlas(specs.map((s) => ({ ...s })), join(app, 'images/items.png'));
copyFileSync(join(pack, 'assets/minecraft/textures/block/grass_block_side.png'), join(app, 'images/grass.png'));
const book = {
  made: new Date().toISOString().slice(0, 10),
  sources: 'Recipes, names, drops, mining, biomes, enchantments, food and effects: minecraft-data (PrismarineJS, MIT). Pictures: Pixel Perfection CE and Mineclonia (CC BY-SA 4.0)',
  atlas: { columns: atlas.columns, cell: atlas.cell, width: atlas.width, height: atlas.height },
  items,
  recipes,
  facts,
  mobs,
  biomes,
  enchants,
  effects,
  topics,
  palette,
  categories,
  where: found.where,
  places: found.places,
};
writeFileSync(join(app, 'data/book.json'), JSON.stringify(book));
writeFileSync(join(app, '.cache/build-review.json'), JSON.stringify({ ...review, noPicture, noName }, null, 1));
const size = (readFileSync(join(app, 'data/book.json')).length / 1024).toFixed(0);
console.log(`book: ${Object.keys(items).length} things, ${Object.keys(recipes).length} with recipes, ${Object.keys(facts).length} facts, ${Object.keys(mobs).length} mobs, ${size} KB`);
console.log(`more: ${Object.keys(biomes).length} biomes, ${Object.keys(enchants).length} enchantments, ${Object.keys(effects).length} effects, ${palette.length} pixel art colours`);
console.log(`book pages: ${Object.entries(categories).map(([k, v]) => `${k} ${v.length}`).join(', ')}`);
console.log(`where to find: ${Object.keys(found.where.mob).length} mobs, ${Object.keys(found.where.item).length} items, ${Object.keys(found.places).length} places${found.noLine.length ? `; mobs with no line: ${found.noLine.join(', ')}` : ''}${found.problems.length ? `; problems: ${found.problems.join('; ')}` : ''}`);
console.log(`pictures: ${specs.length} (${atlas.width}x${atlas.height}); no picture: ${noPicture.length}; no name: ${noName.length}`);
console.log(`left out (not in the released game yet): ${review.unreleased.length}; Bedrock-only crafting: ${review.bedrockOnly.length}; maybe different on Bedrock: ${review.maybeDifferent.length}; details in .cache/build-review.json`);
