// Challenges: picks the next "Surprise me" build challenge. Never the same one twice until every one has been seen,
// then it starts over (but not with the one just shown).

// list: [{ id, text, hint, palette }]. seen: ids already shown, oldest first. pick: a number from 0 up to 1.
// Returns { challenge, seen } with the new list of seen ids.
export function nextChallenge(list, seen = [], pick = Math.random) {
  if (!list.length) return { challenge: null, seen: [] };
  const known = new Set(list.map((c) => c.id));
  let shown = seen.filter((id) => known.has(id));
  let fresh = list.filter((c) => !shown.includes(c.id));
  if (!fresh.length) {
    const last = shown[shown.length - 1];
    shown = [];
    fresh = list.length > 1 ? list.filter((c) => c.id !== last) : list;
  }
  const challenge = fresh[Math.min(fresh.length - 1, Math.floor(pick() * fresh.length))];
  return { challenge, seen: [...shown, challenge.id] };
}

// "9:05" from 545 seconds left. Never below zero.
export function clockText(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
