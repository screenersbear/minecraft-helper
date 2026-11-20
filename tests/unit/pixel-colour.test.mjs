import './_setup.mjs';
import { describe, it, expect } from 'vitest';
import { toLab, labOf, toOklab, blockGap, choices, nearest, labPicture, HALF, halfLightLab, gap } from '../../logic/pixel.js';
import { kMeans } from '../../logic/pixel-colours.js';
import { AUTO, hueGap, shadeGap, joinCost, joinShades } from '../../logic/pixel-shades.js';
import { lightOf, couldBeGrey, lampLight, gainsFor, fixLight } from '../../logic/pixel-light.js';
import { toRgb, middleOf9, median3, kuwahara, smooth } from '../../logic/pixel-smooth.js';
import { realData } from './_setup.mjs';
import { picture, rect, rgbOf } from './_pictures.mjs';

const close = (a, b, d = 0.5) => a.forEach((v, i) => expect(Math.abs(v - b[i])).toBeLessThan(d));
const palette = realData().book.palette;

describe('Lab colours', () => {
  it('white, black and grey', () => {
    close(toLab(0xffffff), [100, 0, 0]);
    close(toLab(0x000000), [0, 0, 0]);
    close(toLab(0x777777), [50, 0, 0], 1);
  });
  it('red is red and yellow is yellow', () => {
    close(toLab(0xff0000), [53.2, 80.1, 67.2], 0.5);
    expect(toLab(0xffff00)[2]).toBeGreaterThan(80);
  });
  it('labOf matches toLab, and very dark values', () => {
    close(labOf(255, 0, 0), toLab(0xff0000), 1e-9);
    expect(labOf(1, 1, 1)[0]).toBeGreaterThan(0);
    expect(labOf(1, 1, 1)[0]).toBeLessThan(1);
  });
  it('OKLab', () => {
    close(toOklab(0xffffff), [100, 0, 0], 0.1);
    close(toOklab(0x000000), [0, 0, 0], 0.1);
    expect(toOklab(0x0000ff)[2]).toBeLessThan(-25);
  });
});

describe('picking blocks', () => {
  const list = choices(palette);
  const idOf = (rgb, l = list) => l[nearest(rgb, l)].id;
  it('every palette block, or only wool', () => {
    expect(list).toHaveLength(palette.length);
    expect(choices(palette, true).every((b) => b.id.endsWith('_wool'))).toBe(true);
    expect(choices([], true)).toEqual([]);
  });
  it('clear colours get the right colour of block', () => {
    expect(idOf(0xffffff)).toMatch(/^white_/);
    expect(idOf(0x0a0a0a)).toMatch(/^black_/);
    expect(idOf(0xd02020)).toMatch(/^red_/);
    expect(idOf(0x2040d0)).toMatch(/^blue_/);
    expect(idOf(0x40c020)).toMatch(/^(lime|green)_/);
  });
  it('a strong colour never gets terracotta', () => {
    for (const c of [0xff0000, 0xff8800, 0x00aaff, 0xffee00]) expect(idOf(c)).not.toMatch(/_terracotta$/);
  });
  it('a dull colour can get terracotta', () => {
    const t = { id: 'brown_terracotta', ok: toOklab(0x7a5a48) };
    expect(blockGap(toOklab(0x7a5a48), t)).toBeCloseTo(0, 6);
  });
  it('wool only', () => expect(idOf(0xd02020, choices(palette, true))).toBe('red_wool'));
  it('an empty list gives place 0', () => expect(nearest(0xffffff, [])).toBe(0));
  it('blockGap counts hue more than lightness', () => {
    const p = toOklab(0x808080);
    const lighter = { id: 'a', ok: toOklab(0xa0a0a0) };
    const redder = { id: 'b', ok: toOklab(0x906060) };
    expect(blockGap(p, lighter)).toBeLessThan(blockGap(p, redder));
  });
});

describe('Lab pictures', () => {
  const rgb = Uint8ClampedArray.from([255, 255, 255, 0, 0, 0, 255, 255, 255]);
  it('3 numbers per pixel, the same colour looked up once', () => {
    const lab = labPicture(rgb);
    expect(lab).toHaveLength(9);
    close(Array.from(lab.slice(0, 3)), [100, 0, 0], 0.05);
    expect(Array.from(lab.slice(6))).toEqual(Array.from(lab.slice(0, 3)));
  });
  it('half lightness', () => {
    expect(HALF).toBe(0.5);
    expect(halfLightLab(rgb)[0]).toBeCloseTo(50, 1);
    expect(labPicture(rgb, 0)[0]).toBe(0);
  });
  it('gap between pixels', () => {
    const lab = halfLightLab(rgb);
    expect(gap(lab, 0, 2)).toBe(0);
    expect(gap(lab, 0, 1)).toBeCloseTo(2500, -1);
  });
  it('an empty picture', () => expect(labPicture(new Uint8ClampedArray(0))).toHaveLength(0));
});

describe('kMeans', () => {
  const lab = Float32Array.from([0, 0, 0, 1, 0, 0, 100, 0, 0, 99, 0, 0, 50, 60, 0]);
  it('splits into the colours there are', () => {
    const groups = kMeans(lab, [0, 1, 2, 3, 4], 3);
    expect(groups[0]).toBe(groups[1]);
    expect(groups[2]).toBe(groups[3]);
    expect(new Set(groups).size).toBe(3);
    expect(groups[0]).toBe(0);
  });
  it('the same answer every time for the same seed', () => expect(kMeans(lab, [0, 1, 2, 3, 4], 2, 7)).toEqual(kMeans(lab, [0, 1, 2, 3, 4], 2, 7)));
  it('more colours than there are leaves some out', () => {
    const flat = Float32Array.from([5, 5, 5, 5, 5, 5, 5, 5, 5]);
    expect(kMeans(flat, [0, 1, 2], 4)).toEqual([0, 0, 0]);
  });
  it('one colour', () => expect(kMeans(lab, [0, 2, 4], 1)).toEqual([0, 0, 0]));
  it('nothing to colour, or no colours', () => {
    expect(kMeans(lab, [], 3)).toEqual([]);
    expect(kMeans(lab, [0, 1], 0)).toEqual([]);
  });
  it('stops after 12 rounds even if the colours are still moving', () => {
    const n = 200;
    const slow = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) slow[i * 3] = 100 * (i / n) ** 2;
    const groups = kMeans(slow, Array.from({ length: n }, (_, i) => i), 4, 1);
    expect(new Set(groups).size).toBe(4);
    for (let i = 1; i < n; i++) expect(groups[i] === groups[i - 1] || !groups.slice(0, i).includes(groups[i])).toBe(true);
  });
  it('a big picture is sampled', () => {
    const n = 9000;
    const big = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) big[i * 3] = i < n / 2 ? 10 : 90;
    const groups = kMeans(big, Array.from({ length: n }, (_, i) => i), 2);
    expect(groups[0]).not.toBe(groups[n - 1]);
    expect(new Set(groups.slice(0, n / 2)).size).toBe(1);
  });
});

describe('shades', () => {
  const lime = [80, -40, 60];
  const limeShadow = [55, -32, 45];
  const yellow = [90, -5, 80];
  const grey = [50, 0, 0];
  it('hue gaps, across the wrap', () => {
    expect(hueGap([50, 10, 0], [50, 0, 10])).toBeCloseTo(90, 5);
    expect(hueGap([50, -10, 1], [50, -10, -1])).toBeLessThan(15);
    expect(hueGap(lime, lime)).toBe(0);
  });
  it('shades of one colour are close; two hues never are', () => {
    expect(shadeGap(lime, limeShadow)).toBeLessThan(AUTO);
    expect(shadeGap(lime, yellow)).toBe(Infinity);
  });
  it('greys have no hue', () => expect(shadeGap(grey, [80, 2, 2])).toBeCloseTo(Math.hypot(15, 2, 2), 5));
  it('join cost: shades first, then other hues', () => {
    expect(joinCost(lime, limeShadow)).toBe(shadeGap(lime, limeShadow));
    expect(joinCost(lime, yellow)).toBeGreaterThan(100);
  });
  it('joins shades on its own, keeps hues apart', () => {
    const r = joinShades([lime, limeShadow, yellow], [40, 40, 40]);
    expect(r.colours).toBe(2);
    expect(r.auto).toBe(2);
    expect(r.most).toBe(3);
    expect(r.groupOf[0]).toBe(r.groupOf[1]);
    expect(r.groupOf[2]).not.toBe(r.groupOf[0]);
  });
  it('fewer or more colours when asked', () => {
    expect(joinShades([lime, limeShadow, yellow], [40, 40, 40], 1).colours).toBe(1);
    expect(joinShades([lime, limeShadow, yellow], [40, 40, 40], 3).colours).toBe(3);
    expect(joinShades([lime, limeShadow, yellow], [40, 40, 40], 99).colours).toBe(3);
    expect(joinShades([lime, limeShadow, yellow], [40, 40, 40], 0).colours).toBe(2);
  });
  it('specks join their closest group', () => {
    const r = joinShades([lime, yellow, [70, -38, 55]], [500, 500, 1]);
    expect(r.most).toBe(2);
    expect(r.groupOf[2]).toBe(r.groupOf[0]);
  });
  it('empty groups are left out', () => {
    const r = joinShades([lime, yellow], [10, 0]);
    expect(r.most).toBe(1);
    expect(r.groupOf[1]).toBe(-1);
  });
  it('one group, and all far apart', () => {
    expect(joinShades([lime], [5])).toMatchObject({ colours: 1, auto: 1, most: 1 });
    const far = joinShades([[10, 0, 0], [90, 0, 0]], [5, 5]);
    expect(far.auto).toBe(2);
  });
});

describe('light', () => {
  const flat = (colour, n = 4) => Uint8ClampedArray.from({ length: n * 3 }, (_, i) => [(colour >> 16) & 255, (colour >> 8) & 255, colour & 255][i % 3]);
  it('average light', () => {
    expect(lightOf(flat(0xffffff), [0, 1])).toEqual([1, 1, 1]);
    expect(lightOf(flat(0x000000), [0])).toEqual([0, 0, 0]);
    expect(lightOf(flat(0xffffff), [])).toEqual([0, 0, 0]);
  });
  it('what could be grey under a lamp', () => {
    expect(couldBeGrey([0.8, 0.8, 0.8])).toBe(true);
    expect(couldBeGrey([0.9, 0.7, 0.4])).toBe(true);
    expect(couldBeGrey([0.02, 0.02, 0.02])).toBe(false);
    expect(couldBeGrey([0.3, 0.5, 0.9])).toBe(false);
    expect(couldBeGrey([0.9, 0.1, 0.1])).toBe(false);
  });
  it('the lamp from the background, the brightest part, or the whole photo', () => {
    const warm = flat(0xffe0b0, 100);
    const mask = new Uint8Array(100).fill(1);
    expect(lampLight(warm, mask).strength).toBe(1);
    expect(lampLight(warm, null).strength).toBe(0.5);
    expect(lampLight(flat(0xf0d0a0, 100), null).strength).toBe(1);
    const white = flat(0xffffff, 100);
    expect(lampLight(white, null)).toEqual({ light: [1, 1, 1], strength: 0.5 });
    expect(lampLight(flat(0x2050e0, 100), null)).toBe(null);
  });
  it('a background that is not grey falls back to the brightest part', () => {
    const rgb = flat(0x2050e0, 100);
    for (let i = 0; i < 10; i++) rgb.set([230, 230, 230], i * 3);
    const mask = new Uint8Array(100).fill(1);
    expect(lampLight(rgb, mask).strength).toBe(1);
  });
  it('gains', () => {
    expect(gainsFor(null)).toEqual([1, 1, 1]);
    expect(gainsFor({ light: [0.5, 0.5, 0.5], strength: 1 })).toEqual([1, 1, 1]);
    const g = gainsFor({ light: [0.9, 0.6, 0.3], strength: 1 });
    expect(g[0]).toBeLessThan(1);
    expect(g[2]).toBeCloseTo(1.6, 5);
    expect(gainsFor({ light: [0, 0.5, 0.5], strength: 0.5 })[0]).toBeCloseTo(1.3, 5);
  });
  it('a warm white wall becomes white', () => {
    const out = fixLight(flat(0xffe0b0, 100), new Uint8Array(100).fill(1));
    expect(Math.abs(out[0] - out[2])).toBeLessThan(12);
  });
  it('black stays black', () => {
    const out = fixLight(flat(0x000000, 4));
    expect(Array.from(out.slice(0, 3))).toEqual([0, 0, 0]);
    expect(couldBeGrey([0, 0, 0])).toBe(false);
  });
  it('with nothing to tell from, only the colours lift', () => {
    const out = fixLight(flat(0x2050e0, 4));
    expect(out[2]).toBeGreaterThanOrEqual(0xe0);
    expect(out[0]).toBeLessThanOrEqual(0x20);
  });
});

describe('smoothing', () => {
  it('RGBA to RGB, see-through as white', () => {
    expect(Array.from(toRgb(Uint8ClampedArray.from([10, 20, 30, 255, 0, 0, 0, 0])))).toEqual([10, 20, 30, 255, 255, 255]);
    expect(Array.from(toRgb(Uint8ClampedArray.from([0, 0, 0, 128])))).toEqual([127, 127, 127]);
    expect(toRgb(new Uint8ClampedArray(0))).toHaveLength(0);
  });
  it('the middle of 9', () => {
    expect(middleOf9([9, 8, 7, 6, 5, 4, 3, 2, 1])).toBe(5);
    expect(middleOf9([1, 1, 1, 1, 9, 9, 9, 9, 9])).toBe(9);
    expect(middleOf9([5, 5, 5, 5, 5, 5, 5, 5, 5])).toBe(5);
    expect(middleOf9([2, 9, 4, 7, 1, 8, 3, 6, 5])).toBe(5);
  });
  it('median takes out a lone pixel', () => {
    const rgb = rgbOf(picture(5, 0xffffff, [rect(2, 2, 3, 3, 0x000000)]));
    const out = median3(rgb, 5);
    expect(out[(2 * 5 + 2) * 3]).toBe(255);
  });
  it('kuwahara keeps an edge sharp and flat parts flat', () => {
    const rgb = rgbOf(picture(8, 0xffffff, [rect(0, 0, 4, 8, 0x000000)]));
    const out = kuwahara(rgb, 8);
    expect(out[(3 * 8 + 3) * 3]).toBe(0);
    expect(out[(3 * 8 + 4) * 3]).toBe(255);
    expect(kuwahara(rgb, 8, 1)[(3 * 8 + 4) * 3]).toBe(255);
  });
  it('smooth does all of it', () => {
    const rgb = rgbOf(picture(8, 0x808080, [rect(4, 4, 5, 5, 0xff0000)]));
    expect(Array.from(smooth(rgb, 8).slice((4 * 8 + 4) * 3, (4 * 8 + 4) * 3 + 3))).toEqual([128, 128, 128]);
  });
  it('a one-pixel picture', () => {
    const rgb = Uint8ClampedArray.from([10, 20, 30]);
    expect(Array.from(smooth(rgb, 1))).toEqual([10, 20, 30]);
  });
});
