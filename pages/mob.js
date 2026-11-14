// Mob answer: what a mob is like (friendly, neutral, hostile or a boss) and what it drops.
import { el } from '../components/el.js';
import { backHash } from '../logic/routes.js';
import { topBar } from '../components/top-bar.js';
import { answerHead } from '../components/answer-head.js';
import { thingList } from '../components/thing-list.js';
import { itemPicture, mobPicture } from '../components/picture.js';
import { feedbackArea } from '../components/feedback-area.js';
import { mobSentence } from '../logic/say.js';

const KIND = { hostile: 'Hostile', neutral: 'Neutral', passive: 'Friendly', boss: 'Boss' };

export function mobPage(ctx, route) {
  const { book } = ctx;
  const mob = book.mobs[route.id];
  if (!mob) return null;
  const say = mobSentence(route.id, book);
  const drops = mob.drops.map((id) => ({ picture: itemPicture(book, id, 24), text: book.items[id]?.name || id }));

  const nodes = [
    ...topBar({ left: { label: 'Back', href: backHash(route) }, right: 'Mobs' }),
    el(
      'div',
      { class: 'page answer' },
      answerHead({ question: route.q, title: mob.name, sentence: say, onSay: () => ctx.say(say) }),
      el(
        'div',
        { class: 'card-row' },
        el('div', { class: 'panel' }, el('div', { class: 'slot big' }, mobPicture(book, route.id, 96))),
        el('span', { class: `tag kind-${mob.kind}` }, KIND[mob.kind]),
      ),
      thingList(drops, 'Drops'),
      feedbackArea(ctx, route.q, mob.name),
    ),
  ];
  return { nodes, say, title: mob.name };
}
