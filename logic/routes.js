// Routes: which screen is showing, kept in the address after # so reloading keeps your place.
// Examples: #/recipe/cake?q=how do I make a cake   #/guide/nether-portal/2   #/grown-ups

export function toHash({ page = 'ask', id, step, way, q } = {}) {
  if (page === 'ask') return '#/';
  const path = [page, id, step].filter((x) => x !== undefined && x !== null && x !== '').map(encodeURIComponent).join('/');
  const query = new URLSearchParams();
  if (q) query.set('q', q);
  if (way) query.set('way', String(way));
  const tail = query.toString();
  return `#/${path}${tail ? `?${tail}` : ''}`;
}

export function parseHash(hash) {
  const raw = String(hash || '').replace(/^#\/?/, '');
  const [path, query = ''] = raw.split('?');
  const [page, id, step] = path.split('/').filter(Boolean).map(decodeURIComponent);
  const params = new URLSearchParams(query);
  return {
    page: page || 'ask',
    id,
    step: step ? Math.max(1, parseInt(step, 10) || 1) : undefined,
    way: parseInt(params.get('way') || '0', 10) || 0,
    q: params.get('q') || '',
  };
}

// Where an answer from findAnswer goes.
export function hashForAnswer(answer, question) {
  if (answer.type === 'none') return toHash({ page: 'none', q: question });
  if (answer.type === 'guide') return toHash({ page: 'guide', id: answer.target.id, step: 1, q: question });
  return toHash({ page: answer.type === 'unpack' ? 'recipe' : answer.type, id: answer.target.id, q: question });
}

// "Today", "Tonight", "Yesterday", "Tuesday", or "Nov 3": for the grown-ups list.
export function whenLabel(time, now = Date.now()) {
  const then = new Date(time);
  const today = new Date(now);
  const days = Math.round((new Date(today.toDateString()) - new Date(then.toDateString())) / 86400000);
  if (days <= 0) return then.getHours() >= 18 ? 'Tonight' : 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return then.toLocaleDateString('en-US', { weekday: 'long' });
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
