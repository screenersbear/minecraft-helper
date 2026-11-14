// Spelling: allows small mistakes ("enchantmen table", "torchs") when comparing two words.

// How many letters you'd change, add or remove (or swap side by side) to turn a into b.
export function editDistance(a, b) {
  if (a === b) return 0;
  const rows = a.length + 1;
  const cols = b.length + 1;
  const d = Array.from({ length: rows }, (_, i) => [i, ...Array(cols - 1).fill(0)]);
  for (let j = 1; j < cols; j++) d[0][j] = j;
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[rows - 1][cols - 1];
}

// How many mistakes a word of this length may have: none for short words, 1 from 4 letters, 2 from 8.
export function allowedMistakes(word) {
  if (word.length >= 8) return 2;
  if (word.length >= 4) return 1;
  return 0;
}

// Close enough to count as the same word? Returns 1 for exact, 0.8 for a small mistake, 0 for no.
export function wordMatch(asked, known) {
  if (asked === known) return 1;
  const limit = Math.min(allowedMistakes(asked), allowedMistakes(known));
  if (!limit || Math.abs(asked.length - known.length) > limit) return 0;
  return editDistance(asked, known) <= limit ? 0.8 : 0;
}
