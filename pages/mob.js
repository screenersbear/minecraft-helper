// Mob answer: what a mob is like (friendly, neutral, hostile or a boss), what it drops, and Ask next buttons for its
// facts (where it lives, what it eats...), and what an add-on changes about it.
import { el } from '../components/el.js';
import { backHash } from '../logic/routes.js';
import { answerLabel } from '../logic/target-name.js';
import { topBar } from '../components/top-bar.js';
import { answerHead } from '../components/answer-head.js';
import { thingList } from '../components/thing-list.js';
import { itemPicture, mobPicture } from '../components/picture.js';
import { answerFooter } from '../components/answer-footer.js';
import { mobSentence } from '../logic/say.js';
import { addonChanges } from '../components/addon-changes.js';

const KIND = { hostile: 'Hostile', neutral: 'Neutral', passive: 'Friendly', boss: 'Boss' };

export function mobPage(ctx, route) {
  const { book } = ctx;
  const mob = book.mobs[route.id];
  if (!mob) return null;
  const target = { type: 'mob', id: route.id };
  // What an add-on that's on changes about it (the drowned in The Bloop), read out after the regular answer.
  const changes = addonChanges(ctx, target);
  const sentence = mobSentence(route.id, book);
  const say = [sentence, changes.say].filter(Boolean).join(' ');
  const drops = mob.drops.map((id) => ({ picture: itemPicture(book, id, 24), text: book.items[id]?.name || id }));
  const footer = answerFooter(ctx, { feedback: { question: route.q, answer: answerLabel('mob', mob.name), target, say }, follow: { topic: target, here: location.hash } });

  const nodes = [
    ...topBar({ back: backHash(route), right: 'Mobs' }, ctx),
    el(
      'div',
      { class: 'page answer' },
      answerHead({ question: route.q, title: mob.name, sentence, onSay: () => ctx.say(say) }),
      el(
        'div',
        { class: 'card-row' },
        el('div', { class: 'panel' }, el('div', { class: 'slot big' }, mobPicture(book, route.id, 96))),
        el('span', { class: `tag kind-${mob.kind}` }, KIND[mob.kind]),
      ),
      thingList(drops, 'Drops'),
      changes.node,
      footer.node,
    ),
  ];
  return { nodes, say, title: mob.name, cleanup: footer.stop, memory: footer.memory };
}
