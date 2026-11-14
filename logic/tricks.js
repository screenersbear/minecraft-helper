// Builder tricks: short guides to one building trick (a roof from stairs, hidden lights), 3 to 5 steps each, with a
// 3D picture of every step. A trick: { id, name, pic, about, wiki, order, key, layers, steps }. key and layers are
// like a build's (see logic/builds.js) and show the finished trick, bottom up. A key entry can also have look (the
// picture to draw when it isn't the block's own, like the top half of a door) and was (the letter that's there
// before this block's step: grass before it becomes a path). Each step: { title, say, tip, add }, where add is the
// letters of the blocks that step adds.

export const entryOf = (entry) => (typeof entry === 'string' ? { id: entry } : entry);
// The block drawn for a key entry.
export const lookId = (entry) => entryOf(entry).look || entryOf(entry).id;

// Which step (0-based) adds each letter: { L: 0, s: 2 }.
export function stepOfLetters(trick) {
  const at = {};
  trick.steps.forEach((step, i) => {
    for (const ch of step.add || '') at[ch] = i;
  });
  return at;
}

// The trick as a build at step n (0-based), to draw: blocks from later steps aren't there yet (or are what was
// there before them), blocks from earlier steps are dim and this step's new blocks are marked, so they stand out.
// Ground (like the grass around a path) is never marked, and nothing is marked when everything is new (the first
// step, with nothing to stand out from). A step that adds nothing shows everything so far, none of it dim.
export function stepBuild(trick, n) {
  const at = stepOfLetters(trick);
  const ground = (ch) => !!entryOf(trick.key[ch] || '').ground;
  const adds = !!trick.steps[n]?.add && Object.entries(at).some(([ch, i]) => i < n || (i === n && ground(ch)));
  const shown = (ch, hops = 0) => {
    const entry = trick.key[ch] && entryOf(trick.key[ch]);
    if (!entry || hops > 4) return null;
    if (at[ch] > n) return entry.was ? shown(entry.was, hops + 1) : null;
    return { ...entry, id: lookId(entry), mark: adds && at[ch] === n && !entry.ground, dim: adds && at[ch] < n };
  };
  const key = {};
  for (const ch of Object.keys(trick.key)) {
    const block = shown(ch);
    if (block) key[ch] = block;
  }
  return { id: `trick-${trick.id}-${n}`, name: trick.name, key, layers: trick.layers };
}

// The blocks step n (0-based) adds, as item ids, each once: ['spruce_stairs', 'spruce_planks'].
export function newBlocks(trick, n) {
  const ids = [...(trick.steps[n]?.add || '')].map((ch) => trick.key[ch] && entryOf(trick.key[ch]).id).filter(Boolean);
  return [...new Set(ids)];
}

// What's wrong with a trick, as a list of sentences (empty when it's fine). hasLook(id): whether there's a picture
// for that block.
export function checkTrick(trick, hasLook = () => true) {
  const problems = [];
  const steps = trick.steps || [];
  if (!trick.name) problems.push('it has no name');
  if (steps.length < 3 || steps.length > 5) problems.push(`it has ${steps.length} steps, not 3 to 5`);
  steps.forEach((s, i) => {
    if (!s.title || !s.say) problems.push(`step ${i + 1} needs a title and something to say`);
  });
  const rows = (trick.layers || []).flatMap((l) => l.rows || []);
  if (!rows.length) problems.push('it has no layers');
  const depth = trick.layers?.[0]?.rows?.length;
  if (trick.layers?.some((l) => l.rows?.length !== depth) || rows.some((r) => r.length !== rows[0].length)) problems.push('its layers are not all the same size');
  const key = trick.key || {};
  for (const ch of new Set(rows.join(''))) if (ch !== '.' && !key[ch]) problems.push(`"${ch}" isn't in the key`);
  const at = stepOfLetters(trick);
  for (const [ch, entry] of Object.entries(key)) {
    const { was } = entryOf(entry);
    if (at[ch] === undefined) problems.push(`no step adds "${ch}"`);
    if (was && !key[was]) problems.push(`"${ch}" was "${was}", which isn't in the key`);
    if (!hasLook(lookId(entry))) problems.push(`there's no picture for ${lookId(entry)}`);
  }
  const added = steps.flatMap((s) => [...(s.add || '')]);
  for (const ch of new Set(added)) {
    if (!key[ch]) problems.push(`a step adds "${ch}", which isn't in the key`);
    if (added.filter((c) => c === ch).length > 1) problems.push(`more than one step adds "${ch}"`);
  }
  return problems;
}
