// Builds every recipe in the book from minecraft-data (MIT), with nothing taken from Mojang's own files:
// crafting from Java 26.1 (checked against Bedrock 1.19.10), furnace, stonecutter and smithing from Bedrock 1.19.10
// (with the stonecutter results it lost worked out in stonecutter.mjs),
// plus the hand-checked fixes in bedrock-fixes.json. Near-copies ("a bed from oak planks", "a bed from birch planks")
// become one recipe with "any planks". Returns { recipes: { id: [recipe, ...] }, review }.
import { readFileSync } from 'node:fs';
import { mergeAlternatives, rank, isUnpack, widenRecolour } from './crafting.mjs';
import { cellFor } from './families.mjs';
import { javaCrafting } from './java-crafting.mjs';
import { readOldBedrock, oldBedrockIds } from './bedrock-old.mjs';
import { lostStonecutter } from './stonecutter.mjs';
import { extraSingles, applyFixes } from './wiki-fixes.mjs';

function groupBy(list, keyOf) {
  const map = new Map();
  for (const x of list) {
    const k = keyOf(x);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(x);
  }
  return map;
}

// Furnace and stonecutter recipes for one thing: one recipe per amount made, listing every input that works.
function mergeSingles(list) {
  const out = [];
  for (const group of groupBy(list, (r) => r.count).values()) {
    let inputs = [...new Set(group.flatMap((r) => r.input.split('|')))];
    // Smelting an ore you'd normally mine (diamond ore into a diamond) isn't how anyone gets it: skip ore inputs.
    if (group[0].how === 'furnace') inputs = inputs.filter((i) => !/_ore$/.test(i));
    if (inputs.length) out.push({ ...group[0], input: cellFor(inputs) });
  }
  return out;
}

// sources: minecraft-data files. released: ids in the released game (Java 26.1 items, so experiments are left out).
// fixesPath: hand-made changes.
export function buildRecipes(sources, releasedJava, fixesPath) {
  const fixes = JSON.parse(readFileSync(fixesPath, 'utf8'));
  const skip = new Set(fixes.leaveOut);
  const released = new Set([...releasedJava, ...fixes.bedrockOnly]);
  const review = { unreleased: new Set() };
  const cells = (r) => [...(r.grid || []).flat(), r.input, ...(r.slots || [])].filter(Boolean).flatMap((c) => c.split('|'));
  const usable = (r) => {
    if (skip.has(r.makes)) return false;
    // A recipe that needs something not in the game (an experiment, or an old id) is left out too.
    if (cells(r).some((c) => !c.startsWith('@') && !released.has(c))) return false;
    if (!released.has(r.makes)) {
      review.unreleased.add(r.makes);
      return false;
    }
    return true;
  };

  const crafting = javaCrafting(sources.javaRecipes, sources.javaItems, sources.bedrockOld);
  const lost = lostStonecutter(sources, oldBedrockIds(sources.bedrockOld));
  const old = [...readOldBedrock(sources.bedrockOld), ...lost, ...extraSingles(fixes)].filter(usable);
  const recipes = {};
  for (const [makes, list] of Object.entries(crafting)) {
    const kept = list.filter((r) => usable({ ...r, makes }));
    if (kept.length) recipes[makes] = kept;
  }
  // Crafting only Bedrock has (a cobweb into string): things Java can't craft at all.
  const bedrockOnly = old.filter((r) => r.how === 'crafting' && !crafting[r.makes]);
  for (const [makes, list] of groupBy(bedrockOnly, (r) => r.makes)) recipes[makes] = rank(mergeAlternatives(list).map(widenRecolour));
  for (const [makes, list] of groupBy(old.filter((r) => r.how !== 'crafting'), (r) => r.makes)) {
    const byHow = groupBy(list, (r) => r.how);
    const singles = [...mergeSingles(byHow.get('furnace') || []), ...mergeSingles(byHow.get('stonecutter') || [])];
    recipes[makes] = [...(recipes[makes] || []), ...(byHow.get('smithing') || []).slice(0, 1), ...singles];
  }
  applyFixes(recipes, fixes, usable);
  for (const id of Object.keys(recipes)) recipes[id] = order(recipes[id]);

  const maybe = Object.entries(recipes).filter(([, l]) => l.some((r) => r.maybeDifferent)).map(([id]) => id);
  return {
    recipes,
    review: { unreleased: [...review.unreleased].sort(), bedrockOnly: [...new Set(bedrockOnly.map((r) => r.makes))].sort(), maybeDifferent: maybe },
  };
}

// Crafting first, then smithing, furnace and stonecutter; unpacking a storage block last of all.
function order(list) {
  const rankOf = { crafting: 0, smithing: 1, furnace: 2, stonecutter: 3 };
  const last = (r) => (r.how === 'crafting' && isUnpack(r) ? 1 : 0);
  return [...list].sort((a, b) => last(a) - last(b) || rankOf[a.how] - rankOf[b.how]);
}
