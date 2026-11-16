// Info answers: a biome (does it rain or snow there), an enchantment, a potion effect, or a topic like "the best food"
// or "breathing underwater".
// They share one layout: the name, a sentence, a big picture, and a few rows of facts.
import { el } from '../components/el.js';
import { topBar } from '../components/top-bar.js';
import { answerHead } from '../components/answer-head.js';
import { thingList } from '../components/thing-list.js';
import { itemPicture } from '../components/picture.js';
import { blockButton } from '../components/buttons.js';
import { answerFooter } from '../components/answer-footer.js';
import { biomeSentence, enchantSentence, effectSentence, drumsticks } from '../logic/say-facts.js';
import { questionKind } from '../logic/understand.js';
import { infoOf, infoName } from '../logic/info.js';
import { toHash, backHash, deeperHash } from '../logic/routes.js';
import { answerLabel } from '../logic/target-name.js';

const WEATHER_ROW = {
  dry: ['sand', 'No rain or snow'],
  snow: ['snowball', 'Snow'],
  'rain-snow-high': ['water_bucket', 'Rain, and snow up high'],
  rain: ['water_bucket', 'Rain'],
  cave: ['stone', "None: it's underground"],
};
const WORLD_ROW = { overworld: ['grass_block', 'The Overworld'], nether: ['netherrack', 'The Nether'], end: ['end_stone', 'The End'] };
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V'];

const row = (book, pic, text, note) => ({ picture: pic ? itemPicture(book, pic, 24) : null, text, note });

// What each type shows: its label in the top bar, its sentence, its rows, and anything extra under them.
const TYPES = {
  biome: {
    label: 'Biomes',
    say: (book, id) => biomeSentence(id, book),
    rows(book, b) {
      const [wPic, wText] = WEATHER_ROW[b.weather];
      const [pPic, pText] = WORLD_ROW[b.world] || WORLD_ROW.overworld;
      return [
        { heading: 'Weather', rows: [row(book, wPic, wText)] },
        { heading: 'World', rows: [row(book, pPic, pText)] },
      ];
    },
    extra(book, b, route) {
      const snowy = book.biomes[b.snowy];
      if (!snowy || b.weather === 'snow') return null;
      return el('div', { class: 'another' }, blockButton({ label: snowy.name, href: toHash({ page: 'biome', id: b.snowy, q: route.q, from: route.from }), extra: { class: 'block-btn tone-grey small-btn' } }));
    },
  },
  enchant: {
    label: 'Enchanting',
    say: (book, id, kind) => enchantSentence(id, book, kind),
    rows(book, e) {
      const level = `${e.max}${ROMAN[e.max] ? ` (${ROMAN[e.max]})` : ''}`;
      const facts = [row(book, null, `Goes on ${e.on}`), row(book, null, `Highest level: ${level}`)];
      if (e.curse) facts.push(row(book, null, 'A curse'));
      if (e.treasure) facts.push(row(book, null, 'Not from the enchanting table'));
      return [{ heading: 'Facts', rows: facts }];
    },
  },
  effect: {
    label: 'Potions',
    say: (book, id) => effectSentence(id, book),
    tag: (e) => (e.good ? ['kind-passive', 'Good effect'] : ['kind-hostile', 'Bad effect']),
    rows: () => [],
  },
  topic: {
    label: 'Food',
    say: (book, id) => book.topics[id].say,
    rows(book, t) {
      // A topic with its own list ("breathing underwater"): each thing links to its own answer.
      if (t.things) {
        const things = t.things.map((x) => ({ ...row(book, x.pic, x.text, x.note), href: x.href && deeperHash(x.href, location.hash) }));
        return [{ heading: t.heading, rows: things }];
      }
      const foods = (t.foods || []).map((id) => row(book, id, book.items[id]?.name || id, drumsticks(book.facts[id]?.food?.points || 0)));
      return [{ heading: 'Best first', rows: foods }];
    },
  },
};

export function infoPage(type) {
  return function page(ctx, route) {
    const { book } = ctx;
    const target = { type, id: route.id };
    const info = infoOf(book, target);
    if (!info) return null;
    const how = TYPES[type];
    const name = infoName(book, target);
    const say = how.say(book, route.id, route.kind || questionKind(route.q));
    const footer = answerFooter(ctx, { feedback: { question: route.q, answer: answerLabel(type, name), target, say }, follow: { topic: target, here: location.hash } });
    const tag = how.tag?.(info);
    const nodes = [
      ...topBar({ back: backHash(route), right: info.label || how.label }, ctx),
      el(
        'div',
        { class: 'page answer' },
        answerHead({ question: route.q, title: name, sentence: say, onSay: () => ctx.say(say) }),
        el(
          'div',
          { class: 'card-row' },
          el('div', { class: 'panel' }, el('div', { class: 'slot big' }, itemPicture(book, info.pic, 96))),
          tag ? el('span', { class: `tag ${tag[0]}` }, tag[1]) : null,
        ),
        how.rows(book, info).map((part) => thingList(part.rows, part.heading)),
        how.extra?.(book, info, route),
        footer.node,
      ),
    ];
    return { nodes, say, title: name, cleanup: footer.stop, memory: footer.memory };
  };
}
