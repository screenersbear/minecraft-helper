// Crafting recipe helpers: merges the
// near-copies ("a bed from oak planks", "a bed from birch planks"...) into one recipe with "any planks".
import { cellFor, looseId } from './families.mjs';

// A recipe's shape with each different ingredient swapped for a letter, plus what each letter was.
function letters(recipe) {
  const order = (a, b) => (looseId(a) < looseId(b) ? -1 : looseId(a) > looseId(b) ? 1 : 0);
  const cells = recipe.shapeless ? [...recipe.grid.flat()].sort(order) : recipe.grid.flat();
  const seen = new Map();
  const mask = cells.map((c) => {
    if (c == null) return '.';
    if (!seen.has(c)) seen.set(c, String.fromCharCode(65 + seen.size));
    return seen.get(c);
  });
  const width = recipe.grid[0].length;
  return { key: `${recipe.count}|${recipe.shapeless}|${width}|${mask.join('')}`, mask, items: [...seen.keys()] };
}

// Merge recipes for one item that only differ by which kind of an ingredient they use.
export function mergeAlternatives(recipes) {
  const groups = new Map();
  for (const r of recipes) {
    const l = letters(r);
    if (!groups.has(l.key)) groups.set(l.key, { first: r, mask: l.mask, options: l.items.map(() => []), recipes: [] });
    const g = groups.get(l.key);
    g.recipes.push(r);
    l.items.forEach((item, i) => g.options[i].push(item));
  }
  const merged = [];
  for (const g of groups.values()) {
    const cellOf = g.options.map((opts) => cellFor(opts));
    // Only merge when the choices are one family ("any planks"). Different things ("planks or sticks") stay separate.
    if (cellOf.some((c) => c.includes('|')) && g.recipes.length > 1) {
      merged.push(...g.recipes);
      continue;
    }
    const width = g.first.grid[0].length;
    const flat = g.mask.map((m) => (m === '.' ? null : cellOf[m.charCodeAt(0) - 65]));
    const grid = [];
    if (g.first.shapeless) {
      const list = flat.filter(Boolean);
      for (let i = 0; i < list.length; i += 3) grid.push(list.slice(i, i + 3));
    } else {
      for (let i = 0; i < flat.length; i += width) grid.push(flat.slice(i, i + width));
    }
    merged.push({ ...g.first, grid });
  }
  return merged;
}

// The different ingredients a recipe uses, with how many of each.
export function needs(recipe) {
  const counts = new Map();
  for (const c of recipe.grid.flat()) if (c) counts.set(c, (counts.get(c) || 0) + 1);
  return counts;
}

// Is this just unpacking a storage block (an iron block into 9 iron ingots)?
export function isUnpack(recipe) {
  const n = needs(recipe);
  if (n.size !== 1) return false;
  const [only] = n.keys();
  const total = [...n.values()][0];
  return total === 1 && recipe.count === 9 && /(_block|^block_of_)/.test(only);
}

// Is this recolouring something (dye plus an item of the same kind)?
export function isRecolour(recipe) {
  const kind = recipe.makes.replace(/^(white|orange|magenta|light_blue|yellow|lime|pink|gray|light_gray|cyan|purple|blue|brown|green|red|black)_/, '');
  // A recolour always uses a dye: "blue ice" from packed ice isn't one.
  if (kind === recipe.makes || !recipe.grid.flat().some((c) => c && c.endsWith('_dye'))) return false;
  return recipe.grid.flat().some((c) => c && c !== recipe.makes && (c.endsWith(`_${kind}`) || c === kind || c === `@${kind}`) && !c.endsWith('_dye'));
}

// Order a thing's recipes: plain crafting first, recolouring and unpacking last, then fewer ingredients.
export function rank(recipes) {
  const score = (r) => (isUnpack(r) ? 100 : 0) + (isRecolour(r) ? 50 : 0) + needs(r).size;
  return [...recipes].sort((a, b) => score(a) - score(b));
}

// A recolouring recipe works with the thing in any colour ("any wool plus orange dye"): say so.
export function widenRecolour(recipe) {
  if (recipe.how !== 'crafting' || !isRecolour(recipe)) return recipe;
  const kind = recipe.makes.replace(/^(white|orange|magenta|light_blue|yellow|lime|pink|gray|light_gray|cyan|purple|blue|brown|green|red|black)_/, '');
  const widen = (c) => (c && !c.endsWith('_dye') && (c.endsWith(`_${kind}`) || c.split('|')[0].endsWith(`_${kind}`)) ? `@${kind}` : c);
  return { ...recipe, grid: recipe.grid.map((row) => row.map(widen)) };
}
