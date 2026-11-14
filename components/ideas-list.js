// Ideas to build, on the grown-ups screen: each saved photo with its title and a Share button.
// Share sends the photo and title with the phone's share sheet (to Messages, Mail, Notes...). Where that isn't
// possible, it saves the photo as a file instead.
import { el } from './el.js';
import { listIdeas, removeIdea, ideaFileName } from '../data/ideas.js';
import { whenLabel } from '../logic/routes.js';

async function photoFile(idea) {
  const blob = await (await fetch(idea.photo)).blob();
  return new File([blob], ideaFileName(idea.title), { type: 'image/jpeg' });
}

async function share(idea) {
  const file = await photoFile(idea);
  const text = `Build idea for the guide: ${idea.title}`;
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: idea.title, text });
    } catch {
      // Closed the share sheet: nothing to do.
    }
    return;
  }
  const link = el('a', { href: URL.createObjectURL(file), download: file.name });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

export function ideasList(ctx) {
  const ideas = listIdeas();
  const rows = ideas.map((idea) =>
    el(
      'li',
      {},
      el('img', { class: 'idea-thumb', src: idea.photo, alt: '' }),
      el('div', { class: 'idea-text' }, el('p', { class: 'log-q' }, idea.title), el('p', { class: 'log-when' }, whenLabel(idea.made))),
      el('div', { class: 'idea-actions' },
        el('button', { class: 'text-btn', type: 'button', onclick: () => share(idea) }, 'Share'),
        // Deletes a saved idea for good, so automatic click tests skip it and it asks first.
        el('button', {
          class: 'text-btn',
          type: 'button',
          'data-test-skip': 'deletes a saved idea',
          onclick: () => {
            if (!window.confirm(`Delete "${idea.title}"? This can't be undone.`)) return;
            removeIdea(idea.id);
            ctx.refresh();
          },
        }, 'Delete'),
      ),
    ),
  );
  return el(
    'section',
    { class: 'ideas' },
    el('h2', { class: 'log-subtitle' }, 'Ideas to build'),
    ideas.length
      ? el('ul', { class: 'log idea-list' }, rows)
      : el('p', { class: 'say' }, 'No ideas yet. Kids can save a photo of something to build from the Make page.'),
    ideas.length ? el('p', { class: 'hint' }, 'Share a photo with Claude and ask for a block-by-block build guide.') : null,
  );
}
