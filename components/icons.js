// Icons: small pixel drawings on a 16 by 16 grid, made of squares. They take the text colour.
const PIXELS = {
  mic: [[6, 1, 4, 8], [3, 6, 1, 3], [12, 6, 1, 3], [4, 9, 1, 1], [11, 9, 1, 1], [5, 10, 6, 1], [7, 11, 2, 2], [5, 13, 6, 1]],
  speaker: [[2, 6, 3, 4], [5, 5, 1, 6], [6, 4, 1, 8], [7, 3, 1, 10], [10, 6, 1, 4], [12, 4, 1, 8]],
  arrow: [[2, 7, 8, 2], [9, 4, 2, 8], [11, 5, 1, 6], [12, 6, 1, 4], [13, 7, 1, 2]],
  check: [[2, 8, 2, 2], [4, 10, 2, 2], [6, 8, 2, 2], [8, 6, 2, 2], [10, 4, 2, 2], [12, 2, 2, 2]],
  flame: [[7, 2, 2, 2], [6, 4, 4, 2], [5, 6, 6, 4], [4, 10, 8, 3], [5, 13, 6, 1]],
};

export function icon(name, size = 28) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  svg.setAttribute('fill', 'currentColor');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('shape-rendering', 'crispEdges');
  for (const [x, y, w, h] of PIXELS[name]) {
    const r = document.createElementNS(ns, 'rect');
    r.setAttribute('x', x);
    r.setAttribute('y', y);
    r.setAttribute('width', w);
    r.setAttribute('height', h);
    svg.append(r);
  }
  return svg;
}
