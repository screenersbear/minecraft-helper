// Colour groups by hue. The photo is first cut into many small colour groups (see pixel-colours.js); this joins
// them. Shades of one colour (the lit side and the shadow of a lime) join, because they're the same hue and differ
// mainly in lightness. Two different hues (lime and yellow) never join on their own, however close they look.
// The number of colours is picked automatically: groups keep joining while they're closer than about Delta E 12.
// The Fewer / More colours slider moves from there; only "fewer than that" can join different hues.
// Colours here are [L, a, b].

export const AUTO = 12; // groups closer than this join on their own
const SAME_HUE = 15; // hues closer than this many degrees count as one colour
const GREYISH = 12; // with less colour (chroma) than this, white, grey and black have no real hue
const TINY = 0.01; // a group with under 1% of the thing's pixels is a speck: it joins its closest group
const OTHER_HUE = 100; // the extra cost of joining two hues, so shades always join first

const chroma = (c) => Math.hypot(c[1], c[2]);

// How far apart two hues are, in degrees (0 to 180).
export function hueGap(p, q) {
  const d = Math.abs(Math.atan2(p[2], p[1]) - Math.atan2(q[2], q[1])) * (180 / Math.PI);
  return d > 180 ? 360 - d : d;
}

// How different two colours are as shades of one colour, or Infinity if they're two different hues.
// Lightness counts a quarter and colour strength half (a shadow is darker and a bit duller); the hue counts in full.
// Greys, white and black have no hue: for them lightness counts half.
export function shadeGap(p, q) {
  const dL = p[0] - q[0];
  const da = p[1] - q[1];
  const db = p[2] - q[2];
  const c1 = chroma(p);
  const c2 = chroma(q);
  if (c1 < GREYISH || c2 < GREYISH) return Math.hypot(dL / 2, da, db);
  if (hueGap(p, q) > SAME_HUE) return Infinity;
  const dC = c1 - c2;
  const dH = Math.sqrt(Math.max(0, da * da + db * db - dC * dC));
  return Math.hypot(dL / 4, dC / 2, dH);
}

// The cost of joining two colours when there have to be fewer: shades first, then anything, closest first.
export function joinCost(p, q) {
  const shade = shadeGap(p, q);
  return Number.isFinite(shade) ? shade : OTHER_HUE + Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
}

// Joins two groups: the new colour is the average of both, by how many pixels each has.
function join(a, b) {
  const count = a.count + b.count;
  const centre = a.centre.map((v, i) => (v * a.count + b.centre[i] * b.count) / count);
  return { centre, count, members: [...a.members, ...b.members] };
}

function cheapestPair(groups) {
  let best = { i: -1, j: -1, cost: Infinity };
  for (let i = 0; i < groups.length; i++) {
    for (let j = i + 1; j < groups.length; j++) {
      const cost = joinCost(groups[i].centre, groups[j].centre);
      if (cost < best.cost) best = { i, j, cost };
    }
  }
  return best;
}

// centres: the small groups' colours. counts: how many pixels each has. wanted: how many colours (null: automatic).
// Returns { groupOf: the final group of each small group, colours: how many there are, auto: the automatic number,
// most: the most there can be }.
export function joinShades(centres, counts, wanted = null) {
  let groups = centres.map((centre, i) => ({ centre, count: counts[i], members: [i] })).filter((g) => g.count > 0);
  const total = groups.reduce((n, g) => n + g.count, 0);
  // Specks join their closest group first.
  for (;;) {
    const speck = groups.findIndex((g) => g.count < total * TINY);
    if (speck < 0 || groups.length < 2) break;
    let partner = -1;
    let cost = Infinity;
    groups.forEach((g, j) => {
      const c = j === speck ? Infinity : joinCost(groups[speck].centre, g.centre);
      if (c < cost) [partner, cost] = [j, c];
    });
    const joined = join(groups[partner], groups[speck]);
    groups = groups.filter((_, j) => j !== speck && j !== partner).concat(joined);
  }
  // Then join the closest two, again and again, remembering each step: [groups after it, its cost].
  const steps = [groups];
  const costs = [];
  while (groups.length > 1) {
    const { i, j, cost } = cheapestPair(groups);
    costs.push(cost);
    groups = groups.filter((_, k) => k !== i && k !== j).concat(join(groups[i], groups[j]));
    steps.push(groups);
  }
  const most = steps[0].length;
  const firstBig = costs.findIndex((c) => c >= AUTO);
  const auto = most - (firstBig < 0 ? costs.length : firstBig);
  const colours = Math.min(most, Math.max(1, Math.round(wanted) || auto));
  const groupOf = new Int16Array(centres.length).fill(-1);
  steps[most - colours].forEach((g, n) => g.members.forEach((m) => (groupOf[m] = n)));
  return { groupOf, colours, auto, most };
}
