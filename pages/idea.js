// Save an idea (#/idea): a photo of something real to build in the game, like your house, with a short title.
// It goes to the grown-ups screen, where it can be shared so a build guide can be made for the book.
import { el } from '../components/el.js';
import { topBar } from '../components/top-bar.js';
import { blockButton } from '../components/buttons.js';
import { photoButtons } from '../components/photo-button.js';
import { photoCanvas } from '../components/crop-box.js';
import { saveIdea } from '../data/ideas.js';

export function ideaPage(ctx) {
  const area = el('div', { class: 'idea-area' });
  const title = el('input', { id: 'idea-title', type: 'text', maxlength: '40', placeholder: 'Our house', autocomplete: 'off', enterkeyhint: 'done' });
  let photo = null;

  const saved = () => {
    area.replaceChildren(
      el('p', { class: 'feedback-q', role: 'status' }, 'Saved! A grown-up will see it.'),
      el('div', { class: 'bottom' }, blockButton({ label: 'Back to Make', tone: 'green', href: '#/make' })),
    );
    ctx.say('Saved! A grown-up will see it.');
  };
  const save = blockButton({
    label: 'Save idea',
    tone: 'green',
    onClick: () => {
      if (!photo) return;
      if (saveIdea({ title: title.value.trim() || 'An idea', photo })) saved();
      else area.prepend(el('p', { class: 'say' }, "The phone is full, so it couldn't save. Ask a grown-up."));
    },
  });

  // A photo was picked: show it, and ask what it is.
  const onPhoto = async (file) => {
    try {
      const canvas = await photoCanvas(file, 800);
      photo = canvas.toDataURL('image/jpeg', 0.8);
      area.replaceChildren(
        el('img', { class: 'idea-photo', src: photo, alt: 'Your photo' }),
        el('label', { class: 'name-it' }, el('span', { class: 'small-label' }, 'What is it?'), title),
        el('div', { class: 'bottom' }, save),
      );
    } catch {
      area.prepend(el('p', { class: 'say' }, "Couldn't open that photo. Try another one."));
    }
  };
  area.append(photoButtons(onPhoto));

  const nodes = [
    ...topBar({ left: { label: 'Back', href: '#/make' }, right: 'Ideas' }),
    el(
      'div',
      { class: 'page idea' },
      el('h1', { class: 'home-title', tabindex: '-1' }, 'Save an idea'),
      el('p', { class: 'home-intro' }, 'Take a photo of something real you want to build, like your house. A grown-up can turn it into a build guide for the book.'),
      area,
    ),
  ];
  return { nodes, title: 'Save an idea' };
}
