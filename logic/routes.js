// Routes: which screen is showing, kept in the address after # so reloading keeps your place.
// Examples: #/recipe/cake?q=how do I make a cake   #/guide/nether-portal/2   #/grown-ups   #/fact/apple?from=book/food
// "from" is the page an answer was opened from (a page of the book), so Back goes there instead of to Ask.
// "k" is the kind of question, when it can't be told from the question itself (a follow-up like "what about wolves").
import { targetKey } from './where.js';

const SAFE_FROM = /^[a-z0-9_/-]+$/;
const SAFE_KIND = /^[a-z]{2,12}$/;

export function toHash({ page = 'ask', id, step, way, q, from, kind } = {}) {
  if (page === 'ask') return '#/';
  const path = [page, id, step].filter((x) => x !== undefined && x !== null && x !== '').map(encodeURIComponent).join('/');
  const query = new URLSearchParams();
  if (q) query.set('q', q);
  if (way) query.set('way', String(way));
  if (from && SAFE_FROM.test(from)) query.set('from', from);
  if (kind && SAFE_KIND.test(kind)) query.set('k', kind);
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
    from: SAFE_FROM.test(params.get('from') || '') ? params.get('from') : '',
    kind: SAFE_KIND.test(params.get('k') || '') ? params.get('k') : '',
  };
}

// Where an answer's Back link goes: the page it came from, or Ask.
export const backHash = (route) => (route.from ? `#/${route.from}` : '#/');

// Where an answer from findAnswer goes. kind: added when the question alone doesn't say it (a follow-up).
export function hashForAnswer(answer, question, kind) {
  if (answer.type === 'none') return toHash({ page: 'none', q: question });
  if (answer.type === 'guide') return toHash({ page: 'guide', id: answer.target.id, step: 1, q: question });
  if (answer.type === 'where') return toHash({ page: 'where', id: targetKey(answer.target), q: question, kind });
  if (answer.type === 'missing') return toHash({ page: 'missing', id: targetKey(answer.target), q: question, kind: answer.kind });
  return toHash({ page: answer.type === 'unpack' ? 'recipe' : answer.type, id: answer.target.id, q: question, kind });
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
