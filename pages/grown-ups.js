// For grown-ups: questions to look at (grouped by what went wrong, X to take one off when it's done), ideas to
// build, and a switch per add-on. Copy the list copies what's still on it, to paste into Claude Code. Opened by holding the title on Ask.
import { el } from '../components/el.js';
import { topBar } from '../components/top-bar.js';
import { blockButton } from '../components/buttons.js';
import { ideasList } from '../components/ideas-list.js';
import { addonSwitches } from '../components/addon-switches.js';
import { questionLog } from '../components/question-log.js';
import { listQuestions, clearQuestions, copyText } from '../data/questions-log.js';

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

export function grownUpsPage(ctx) {
  const log = questionLog(listQuestions());
  const copyButton = blockButton({
    label: 'Copy the list',
    tone: 'green',
    onClick: async () => {
      const left = log.entries();
      const ok = left.length && (await copy(copyText(left)));
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
      const count = log.entries().length;
      if (!count) return;
      if (!window.confirm(`Clear all ${count} questions? This can't be undone.`)) return;
      clearQuestions();
      ctx.refresh();
    },
  });

  const nodes = [
    ...topBar({ back: '#/', right: 'For grown-ups' }, ctx),
    el(
      'div',
      { class: 'page grown-ups' },
      el(
        'div',
        { class: 'answer-head' },
        el('h1', { class: 'log-title', tabindex: '-1' }, 'Questions', el('br'), 'to look at'),
        el('p', { class: 'say' }, "What the app couldn't answer, and answers kids said didn't help, grouped by what went wrong. Tap the X when one is done."),
      ),
      log.node,
      el(
        'div',
        { class: 'log-actions' },
        el('p', { class: 'hint' }, 'Copy the list and paste it into Claude Code. It checks each one and reports back before changing anything.'),
        el('div', { class: 'copy-row' }, copyButton, clearButton),
      ),
      ideasList(ctx),
      addonSwitches(ctx.allAddons),
    ),
  ];
  return { nodes, title: 'Questions to look at' };
}
