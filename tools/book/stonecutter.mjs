// Stonecutter recipes the old Bedrock data lost. That data (minecraft-data, Bedrock 1.19.10) says which block goes
// in, but often not which slab or wall comes out ("stone_block_slab3" is eight slabs). So the result is worked out
// from Java's crafting recipes: a block crafted into its stairs, slab, wall, bricks, pillar, or a polished, cut or
// chiseled kind can be cut into the same thing, one each, or two for a slab (minecraft.wiki, Stonecutter). The old
// Bedrock data must show the stonecutter taking that block for that kind of result. Things newer than that data
// (tuff, resin bricks) follow the same rule. Copper (it cuts into 4) and wood (it can't be cut) are left out.
import { modernId, variantsOf } from './bedrock-names.mjs';

const RESULT = /_(slab|stairs|wall|bricks|tiles|pillar)$|^(polished|cut|chiseled)_/;
const NOT_STONE = /planks|bamboo|mosaic|_log$|_wood$|_stem$|hyphae|copper/;

// The one thing a Java recipe is made from, or null when it needs two different things.
function onlyIngredient(recipe) {
  const cells = (recipe.inShape || recipe.ingredients.map((c) => [c])).flat().filter((c) => c != null);
  const kinds = [...new Set(cells)];
  return kinds.length === 1 ? kinds[0] : null;
}

// "from" -> "makes" pairs Java crafts: stone -> stone_bricks, stone_bricks -> stone_brick_slab.
function craftedFrom(javaRecipes, nameOf, isBlock) {
  const pairs = [];
  for (const r of Object.values(javaRecipes).flat()) {
    const makes = nameOf(r.result.id);
    const from = nameOf(onlyIngredient(r));
    if (makes && from && makes !== from && isBlock(from) && RESULT.test(makes)) pairs.push([from, makes]);
  }
  // Chiseled kinds are crafted from two slabs, but cut from the block the slab is made of.
  const slabOf = new Map();
  for (const [f, m] of pairs) if (m.endsWith('_slab')) slabOf.set(m, [...(slabOf.get(m) || []), f]);
  return pairs
    .flatMap(([f, m]) => (slabOf.has(f) && !m.endsWith('_slab') ? slabOf.get(f).map((b) => [b, m]) : [[f, m]]))
    .filter(([f, m]) => f !== m && !NOT_STONE.test(f) && !NOT_STONE.test(m));
}

// Returns stonecutter recipes as { makes, count, how: 'stonecutter', input }.
export function lostStonecutter(sources, knownIds) {
  const names = new Map(sources.javaItems.map((i) => [i.id, i.name]));
  const nameOf = (id) => names.get(id);
  const blocks = new Set(sources.javaBlocks.map((b) => b.name));
  const cuts = new Set();
  for (const r of Object.values(sources.bedrockOld)) {
    if (r.type !== 'stonecutter') continue;
    const input = modernId(r.ingredients[0].name, r.ingredients[0].metadata);
    for (const out of variantsOf(r.output[0].name)) cuts.add(`${input}>${out}`);
  }
  const allowed = (from, makes) => cuts.has(`${from}>${makes}`) || !knownIds.has(from) || !knownIds.has(makes);

  // Cutting chains: stone -> stone bricks -> stone brick slab means stone -> stone brick slab too.
  // Only the end result has to be allowed: stone -> chiseled stone bricks is, even where stone bricks -> chiseled isn't listed.
  const edges = new Set(craftedFrom(sources.javaRecipes, nameOf, (id) => blocks.has(id)).map(([f, m]) => `${f}>${m}`));
  for (let grew = true; grew; ) {
    grew = false;
    for (const a of [...edges]) {
      const [f, mid] = a.split('>');
      for (const b of [...edges]) {
        const [mid2, m] = b.split('>');
        if (mid2 === mid && m !== f && !edges.has(`${f}>${m}`)) {
          edges.add(`${f}>${m}`);
          grew = true;
        }
      }
    }
  }
  return [...edges]
    .map((e) => e.split('>'))
    .filter(([f, m]) => allowed(f, m))
    .map(([input, makes]) => ({ makes, count: makes.endsWith('_slab') ? 2 : 1, how: 'stonecutter', input }));
}
