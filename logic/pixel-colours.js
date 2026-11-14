// Cutting the thing into a few colours (k-means): start with a few colours from the picture, give every pixel the
// closest one, move each colour to the middle of its pixels, and repeat. The pieces it makes are then joined into
// colour groups by hue (see pixel-shades.js).

const ROUNDS = 12;
const MOST_SAMPLES = 4000;

// The same "random" numbers every time, so the same photo always gives the same picture.
function steadyRandom(seed) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const far = (lab, i, centre) => (lab[i * 3] - centre[0]) ** 2 + (lab[i * 3 + 1] - centre[1]) ** 2 + (lab[i * 3 + 2] - centre[2]) ** 2;
const at = (lab, i) => [lab[i * 3], lab[i * 3 + 1], lab[i * 3 + 2]];

// Starting colours: the first at random, each next one likely to be far from the ones picked (k-means++).
function startingColours(lab, sample, k, random) {
  const centres = [at(lab, sample[Math.floor(random() * sample.length)])];
  const nearest = sample.map((p) => far(lab, p, centres[0]));
  while (centres.length < k) {
    const total = nearest.reduce((a, b) => a + b, 0);
    if (total === 0) break;
    let pick = random() * total;
    let chosen = sample.length - 1;
    for (let i = 0; i < sample.length; i++) {
      pick -= nearest[i];
      if (pick <= 0) {
        chosen = i;
        break;
      }
    }
    const centre = at(lab, sample[chosen]);
    centres.push(centre);
    sample.forEach((p, i) => {
      nearest[i] = Math.min(nearest[i], far(lab, p, centre));
    });
  }
  return centres;
}

// The closest colour to pixel p.
function closest(lab, p, centres) {
  let best = 0;
  let bestGap = Infinity;
  centres.forEach((c, i) => {
    const d = far(lab, p, c);
    if (d < bestGap) {
      best = i;
      bestGap = d;
    }
  });
  return best;
}

// lab: the picture in Lab (see labPicture in pixel.js). pixels: which pixels to colour (the thing, not the background). k: how many
// colours. The colours are worked out on a sample of the pixels (quicker, and just as good), then every pixel gets
// the closest. Returns a colour number for each pixel, in the same order; colours nothing ended up in are left out,
// so there may be fewer than k, numbered 0, 1, 2... in the order they first appear.
export function kMeans(lab, pixels, k, seed = 1) {
  if (!pixels.length || k < 1) return [];
  const step = Math.max(1, Math.floor(pixels.length / MOST_SAMPLES));
  const sample = pixels.filter((_, i) => i % step === 0);
  let centres = startingColours(lab, sample, k, steadyRandom(seed));
  let groups = sample.map((p) => closest(lab, p, centres));
  for (let round = 0; round < ROUNDS; round++) {
    const sums = centres.map(() => [0, 0, 0, 0]);
    sample.forEach((p, i) => {
      const s = sums[groups[i]];
      s[0] += lab[p * 3];
      s[1] += lab[p * 3 + 1];
      s[2] += lab[p * 3 + 2];
      s[3] += 1;
    });
    centres = sums.filter((s) => s[3] > 0).map((s) => [s[0] / s[3], s[1] / s[3], s[2] / s[3]]);
    const next = sample.map((p) => closest(lab, p, centres));
    const moved = next.some((g, i) => g !== groups[i]);
    groups = next;
    if (!moved) break;
  }
  const renumber = new Map();
  return pixels.map((p) => {
    const g = closest(lab, p, centres);
    if (!renumber.has(g)) renumber.set(g, renumber.size);
    return renumber.get(g);
  });
}
