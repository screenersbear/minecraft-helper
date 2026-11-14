// From colour groups to a grid of blocks: each square takes the most common group in its part of the picture, then
// a clean-up takes away lone blocks and specks, so it's easy to build. An outline can go around the thing.
// Grids are size by size, one group number per square, top row first.

// labels: a group number for each pixel (width by width). square: the part of the photo to use ({ x, y, side },
// all of it if left out). Returns the most common group in each square of the grid (not the average, so no
// in-between colours). A tie goes to the lower group number. Each square looks at 1 pixel or more.
export function cellModes(labels, width, size, square = { x: 0, y: 0, side: width }) {
  const cells = new Int16Array(size * size);
  const step = square.side / size;
  const count = new Map();
  const span = (i, from) => {
    const start = Math.min(width - 1, from + Math.floor(i * step));
    return [start, Math.min(width, Math.max(start + 1, from + Math.floor((i + 1) * step)))];
  };
  for (let row = 0; row < size; row++) {
    const [y0, y1] = span(row, square.y);
    for (let col = 0; col < size; col++) {
      const [x0, x1] = span(col, square.x);
      count.clear();
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const g = labels[y * width + x];
          count.set(g, (count.get(g) || 0) + 1);
        }
      }
      let best = 0;
      let most = -1;
      for (const [g, n] of count) {
        if (n > most || (n === most && g < best)) {
          best = g;
          most = n;
        }
      }
      cells[row * size + col] = best;
    }
  }
  return cells;
}

// The squares above, below, left and right of square i.
export function sides(i, size) {
  const x = i % size;
  const out = [];
  if (i >= size) out.push(i - size);
  if (i < size * (size - 1)) out.push(i + size);
  if (x > 0) out.push(i - 1);
  if (x < size - 1) out.push(i + 1);
  return out;
}

// A square whose sides are mostly (3 of 4, or all of them on the edge) one other group takes that group.
export function majority(cells, size) {
  const out = Int16Array.from(cells);
  for (let i = 0; i < cells.length; i++) {
    const next = sides(i, size);
    const count = new Map();
    for (const j of next) if (cells[j] !== cells[i]) count.set(cells[j], (count.get(cells[j]) || 0) + 1);
    for (const [g, n] of count) if (n * 4 >= next.length * 3) out[i] = g;
  }
  return out;
}

// Patches of one group joined by their sides: [{ group, squares }].
export function patches(cells, size) {
  const seen = new Uint8Array(cells.length);
  const out = [];
  for (let start = 0; start < cells.length; start++) {
    if (seen[start]) continue;
    seen[start] = 1;
    const squares = [start];
    for (let head = 0; head < squares.length; head++) {
      for (const j of sides(squares[head], size)) {
        if (!seen[j] && cells[j] === cells[start]) {
          seen[j] = 1;
          squares.push(j);
        }
      }
    }
    out.push({ group: cells[start], squares });
  }
  return out;
}

// Patches smaller than `smallest` squares take the group they touch most.
export function removeIslands(cells, size, smallest = 3) {
  const out = Int16Array.from(cells);
  for (const { group, squares } of patches(cells, size)) {
    if (squares.length >= smallest) continue;
    const count = new Map();
    for (const i of squares) for (const j of sides(i, size)) if (out[j] !== group) count.set(out[j], (count.get(out[j]) || 0) + 1);
    let best = group;
    let most = 0;
    for (const [g, n] of count) {
      if (n > most) {
        best = g;
        most = n;
      }
    }
    for (const i of squares) out[i] = best;
  }
  return out;
}

// The clean-up: lone blocks take their neighbours' colour, then specks under 3 blocks go. Twice.
export function cleanUp(cells, size) {
  let out = cells;
  for (let pass = 0; pass < 2; pass++) out = removeIslands(majority(out, size), size);
  return out;
}

// The outline: background squares touching the thing (on a side or a corner). Returns their places.
export function outlineSquares(cells, size, background) {
  const out = [];
  for (let i = 0; i < cells.length; i++) {
    if (cells[i] !== background) continue;
    const x = i % size;
    const y = Math.floor(i / size);
    let touches = false;
    for (let dy = -1; dy <= 1 && !touches; dy++) {
      for (let dx = -1; dx <= 1 && !touches; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < size && ny < size && cells[ny * size + nx] !== background) touches = true;
      }
    }
    if (touches) out.push(i);
  }
  return out;
}
