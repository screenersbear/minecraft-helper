// Add-on answer: one answer from an add-on pack (#/addon/the-bloop:inside). Its words, a tag saying which add-on
// it's from, a quiet "might be different in your version" line when only an unofficial site backs it up, and
// "Want to know more?" buttons one step deeper. A question with no answer yet says "I don't know that yet"
// (#/addon/the-bloop:enchantments, or #/addon/the-bloop when nothing in the add-on matched).
import { el } from '../components/el.js';
import { topBar } from '../components/top-bar.js';
import { answerHead } from '../components/answer-head.js';
import { blockButton } from '../components/buttons.js';
import { answerFooter } from '../components/answer-footer.js';
import { digDeeper } from '../components/dig-deeper.js';
import { logQuestion } from '../data/questions-log.js';
import { addonOf, addonKey, askFor, moreOf, besideOf, isSure, addonMissing, MAYBE } from '../logic/addon.js';
import { findInAddon } from '../logic/addon-search.js';
import { toHash, backHash } from '../logic/routes.js';
import { addonHome } from '../logic/chapters.js';

const NOT_YET = "I don't know that yet.";

// Asks one add-on a question: opens the best answer, or "I don't know that yet" (saved for the grown-ups list as
// "Missing (The Bloop): ..."). id: the answer when it's already found. from: where back goes (the add-on's chapter;
// '' for Ask).
export function askAddon(ctx, pack, question, { id: found, from = addonHome(pack).slice(2) } = {}) {
  const q = String(question || '').trim();
  if (!q) return;
  const id = found || findInAddon(pack, q) || '';
  if (!pack.answers[id]) {
    const missing = addonMissing(pack, q);
    logQuestion({ q, answer: missing, reason: 'missing', missing });
  }
  ctx.go(toHash({ page: 'addon', id: addonKey(pack, id), q, from }));
}

export function addonAnswerPage(ctx, route) {
  const found = addonOf(ctx.addons, route.id);
  if (!found) return null;
  const { pack, id } = found;
  const answer = pack.answers[id];
  // An id the add-on doesn't know at all (not even as a question with no answer yet) is a broken address.
  if (id && !answer && !askFor(pack, id)) return null;
  const sentence = answer ? answer.say : NOT_YET;
  const unsure = Boolean(answer) && !isSure(pack, answer);
  // Read out, it says where it comes from: "In The Bloop add-on, ...", unless it already says "add-on".
  const from = answer && !/add-on/i.test(sentence) ? `In ${pack.name} add-on, ${sentence.charAt(0).toLowerCase()}${sentence.slice(1)}` : sentence;
  const say = unsure ? `${from} ${MAYBE}` : from;
  const title = answer?.title || pack.name;
  // Under an answer: what's one step deeper. Under a question with no answer yet: the questions next to it.
  const more = answer ? moreOf(pack, id) : id ? besideOf(pack, id) : [];
  const dig = digDeeper(
    more.map((m) => ({ label: m.ask, hash: toHash({ page: 'addon', id: addonKey(pack, m.id), q: m.ask }), missing: m.missing ? addonMissing(pack, m.ask) : '' })),
  );
  const footer = answerFooter(ctx, {
    feedback: answer ? { question: route.q, answer: `${pack.name}: ${title}`, say, suggest: false } : false,
    talk: { onQuestion: (q) => askAddon(ctx, pack, q), about: `about ${pack.name}` },
  });
  const allAbout = blockButton({ label: `All about ${pack.name}`, tone: 'grey', href: addonHome(pack), extra: { class: 'block-btn tone-grey small-btn' } });

  const nodes = [
    ...topBar({ back: backHash(route), right: pack.name }, ctx),
    el(
      'div',
      { class: 'page answer addon-answer' },
      answerHead({ question: route.q, title, sentence, onSay: () => ctx.say(say) }),
      el('div', { class: 'card-row' }, el('span', { class: 'tag addon-tag', style: { '--pack': pack.colour } }, `${pack.name} add-on`)),
      unsure ? el('p', { class: 'maybe' }, MAYBE) : null,
      dig,
      answer ? null : el('div', { class: 'another' }, allAbout),
      footer.node,
    ),
  ];
  return { nodes, say, title, cleanup: footer.stop };
}
