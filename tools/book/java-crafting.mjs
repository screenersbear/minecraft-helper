// Crafting recipes from minecraft-data's Java 26.1 recipes (MIT): the newest recipe data it has, and nearly always
// the same as Bedrock. Each one is checked against minecraft-data's older Bedrock 1.19.10 recipes: if Bedrock had
// that thing with different ingredients, the recipe is marked "maybe different".
import { looseId } from './families.mjs';
import { mergeAlternatives, rank, widenRecolour } from './crafting.mjs';
import { oldBedrockNeeds, oldBedrockIds } from './bedrock-old.mjs';

const COLOUR_OR_WOOD = /^(white|orange|magenta|light_blue|yellow|lime|pink|gray|light_gray|cyan|purple|blue|brown|green|red|black|oak|spruce|birch|jungle|acacia|dark_oak)_/;

function fromJava(recipe, nameOf) {
  const makes = nameOf(recipe.result.id);
  const count = recipe.result.count;
  if (recipe.inShape) {
    const grid = recipe.inShape.map((row) => row.map((c) => (c == null ? null : nameOf(c))));
    return { makes, count, how: 'crafting', grid, shapeless: false };
  }
  const list = recipe.ingredients.map(nameOf);
  const grid = [];
  for (let i = 0; i < list.length; i += 3) grid.push(list.slice(i, i + 3));
  return { makes, count, how: 'crafting', grid, shapeless: true };
}

// The ingredients a recipe needs, loosely ("any planks"), with counts.
function looseNeeds(cells) {
  const m = new Map();
  for (const c of cells) if (c) m.set(looseId(c.split('|')[0]), (m.get(looseId(c.split('|')[0])) || 0) + 1);
  return m;
}

const sameNeeds = (a, b) => a.size === b.size && [...a].every(([k, v]) => b.get(k) === v);

// Returns { id: [recipe, ...] } for every thing Java can craft.
export function javaCrafting(javaRecipes, javaItems, bedrockOld) {
  const names = new Map(javaItems.map((i) => [i.id, i.name]));
  const nameOf = (id) => names.get(id);
  const old = oldBedrockNeeds(bedrockOld);
  const known = oldBedrockIds(bedrockOld);
  // Uses something newer than Bedrock 1.19.10 (a cherry plank, a copper nugget): nothing to check against.
  const newer = (r) => r.grid.flat().some((c) => c && c.split('|').every((x) => !x.startsWith('@') && !known.has(x)));
  const byItem = new Map();
  for (const r of Object.values(javaRecipes).flat()) {
    const x = fromJava(r, nameOf);
    if (!x.makes) continue;
    if (!byItem.has(x.makes)) byItem.set(x.makes, []);
    byItem.get(x.makes).push(x);
  }
  const out = {};
  for (const [makes, list] of byItem) {
    const olds = old.get(makes) || old.get(makes.replace(COLOUR_OR_WOOD, '*_')) || [];
    out[makes] = rank(mergeAlternatives(list).map(widenRecolour)).map((r) => {
      // Not in Bedrock 1.19.10 at all (newer things): nothing to check against, so it's trusted.
      if (!olds.length || newer(r)) return r;
      const ok = olds.some((o) => o.count === r.count && sameNeeds(looseNeeds(r.grid.flat()), o.needs));
      return ok ? r : { ...r, maybeDifferent: true };
    });
  }
  return out;
}

export { COLOUR_OR_WOOD };
