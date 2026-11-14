// The hand-made fixes in bedrock-fixes.json, each checked on minecraft.wiki for Bedrock.

// Extra furnace and smithing recipes, one input each, so they merge with the built ones ("sand or red sand").
export function extraSingles(fixes) {
  const out = [];
  for (const [makes, inputs] of Object.entries(fixes.furnace || {})) {
    for (const input of inputs) out.push({ makes, count: 1, how: 'furnace', input });
  }
  for (const [makes, base] of Object.entries(fixes.netheriteUpgrade || {})) {
    out.push({ makes, count: 1, how: 'smithing', slots: ['netherite_upgrade_smithing_template', base, 'netherite_ingot'] });
  }
  return out;
}

// Bedrock dyes carpet 8 at a time: 8 white carpet around one dye (minecraft.wiki, Carpet). Java's "any carpet + a dye"
// isn't in Bedrock, and white carpet is only made from wool.
function bedrockCarpet(recipe, makes) {
  const cells = recipe.grid.flat();
  if (!makes.endsWith('_carpet') || !cells.includes('@carpet')) return recipe;
  if (makes === 'white_carpet') return null;
  const dye = cells.find((c) => c && c.endsWith('_dye'));
  const w = 'white_carpet';
  return { count: 8, how: 'crafting', grid: [[w, w, w], [w, dye, w], [w, w, w]], shapeless: false };
}

// Applies "checked", "replace", the carpet rule and "recipes" to the built recipes ({ id: [recipe, ...] }).
// usable(recipe) says whether a recipe's things are all in the released game.
export function applyFixes(recipes, fixes, usable) {
  for (const [makes, list] of Object.entries(fixes.replace || {})) {
    const kept = (recipes[makes] || []).filter((r) => r.how !== 'crafting');
    recipes[makes] = [...list.filter((r) => usable({ ...r, makes })), ...kept];
  }
  const checked = new Set(fixes.checked || []);
  for (const [makes, list] of Object.entries(recipes)) {
    recipes[makes] = list
      .map((r) => (r.how === 'crafting' ? bedrockCarpet(r, makes) : r))
      .filter(Boolean)
      .map((r) => {
        if (!checked.has(makes) || !r.maybeDifferent) return r;
        const { maybeDifferent, ...rest } = r;
        return rest;
      });
  }
  for (const r of fixes.recipes || []) if (usable(r)) (recipes[r.makes] ||= []).push(r);
}
