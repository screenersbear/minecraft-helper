// For grown-ups: questions to add (everything the book couldn't answer, newest first) and ideas to build.
// Copy the list to paste into Claude Code, or clear it. Opened by holding the title on the Ask screen.
import { el } from '../components/el.js';
import { topBar } from '../components/top-bar.js';
import { blockButton } from '../components/buttons.js';
import { ideasList } from '../components/ideas-list.js';
import { listQuestions, clearQuestions, detailText, copyText, WHY } from '../data/questions-log.js';
import { whenLabel } from '../logic/routes.js';
import { tidyQuestion } from '../logic/say.js';

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older Safari: copy from a hidden text box instead.
    const box = el('textarea', { readonly: true, style: { position: 'fixed', opacity: '0' } });
    box.value = text;
    document.body.append(box);
    box.select();
    const ok = document.execCommand('copy');
    box.remove();
    return ok;
  }
}

function rows(list) {
  if (!list.length) return el('p', { class: 'say' }, "Nothing to add yet. Questions the book can't answer show up here.");
  return el(
    'ul',
    { class: 'log' },
    list.map((e) =>
      el(
        'li',
        {},
        el('div', {}, el('p', { class: 'log-q' }, tidyQuestion(e.q)), el('p', { class: 'log-when' }, `${whenLabel(e.last)} · ${detailText(e)}`)),
        el('span', { class: `tag ${e.why === 'not-in-book' ? 'tag-mango' : 'tag-grey'}` }, WHY[e.why]),
      ),
    ),
  );
}

export function grownUpsPage(ctx) {
  const list = listQuestions();
  const copyButton = blockButton({
    label: 'Copy the list',
    tone: 'green',
    onClick: async () => {
      const ok = list.length && (await copy(copyText(list)));
      copyButton.textContent = ok ? 'Copied!' : 'Nothing to copy';
      setTimeout(() => (copyButton.textContent = 'Copy the list'), 2000);
    },
  });
  // Clear wipes the saved questions for good, so automatic click tests skip it (data-test-skip) and it asks first.
  const clearButton = blockButton({
    label: 'Clear',
    tone: 'grey',
    extra: { 'data-test-skip': 'deletes the saved questions' },
    onClick: () => {
      if (!list.length) return;
      if (!window.confirm(`Clear all ${list.length} questions? This can't be undone.`)) return;
      clearQuestions();
      ctx.refresh();
    },
  });

  const nodes = [
    ...topBar({ left: { label: 'Done', href: '#/' }, right: 'For grown-ups', grass: false }),
    el(
      'div',
      { class: 'page grown-ups' },
      el(
        'div',
        { class: 'answer-head' },
        el('h1', { class: 'log-title', tabindex: '-1' }, 'Questions', el('br'), 'to add'),
        el('p', { class: 'say' }, "Everything it couldn't answer, plus answers kids said didn't help, and ideas they saved to build. Newest first."),
      ),
      rows(list),
      el(
        'div',
        { class: 'log-actions' },
        el('p', { class: 'hint' }, 'Paste the list into Claude Code and ask it to add these to the book.'),
        el('div', { class: 'copy-row' }, copyButton, clearButton),
      ),
      ideasList(ctx),
    ),
  ];
  return { nodes, title: 'Questions to add' };
}
