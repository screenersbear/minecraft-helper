// Add to My builds (#/mine/new): take or pick a photo of something you built, give it a name, and save it.
import { el } from '../components/el.js';
import { topBar } from '../components/top-bar.js';
import { blockButton } from '../components/buttons.js';
import { photoButtons } from '../components/photo-button.js';
import { photoCanvas } from '../components/crop-box.js';
import { addMyBuild } from '../data/my-builds.js';

const FULL = 'The phone is full, so it couldn\'t save. Delete an old photo in My builds first.';

export function mineNewPage(ctx) {
  const area = el('div', { class: 'idea-area' });
  const name = el('input', { id: 'build-name', type: 'text', maxlength: '40', placeholder: 'My castle', autocomplete: 'off', enterkeyhint: 'done' });
  let photo = null;

  const save = blockButton({
    label: 'Save it',
    tone: 'green',
    onClick: () => {
      if (!photo) return;
      const saved = addMyBuild({ name: name.value.trim() || 'My build', photo });
      if (saved) return ctx.go(`#/mine/${saved.id}`, { replace: true });
      area.prepend(el('p', { class: 'say', role: 'alert' }, FULL));
      ctx.say(FULL);
    },
  });

  // A photo was picked: show it, and ask what it is.
  const onPhoto = async (file) => {
    try {
      const canvas = await photoCanvas(file, 720);
      photo = canvas.toDataURL('image/jpeg', 0.75);
      area.replaceChildren(
        el('img', { class: 'idea-photo', src: photo, alt: 'Your photo' }),
        el('label', { class: 'name-it' }, el('span', { class: 'small-label' }, 'What did you build?'), name),
        el('div', { class: 'bottom' }, save),
      );
    } catch {
      area.prepend(el('p', { class: 'say' }, "Couldn't open that photo. Try another one."));
    }
  };
  area.append(photoButtons(onPhoto));

  return {
    title: 'Add a photo',
    nodes: [
      ...topBar({ left: { label: 'My builds', href: '#/mine' }, right: 'My builds' }),
      el(
        'div',
        { class: 'page idea' },
        el('h1', { class: 'home-title', tabindex: '-1' }, 'Add a photo'),
        el('p', { class: 'home-intro' }, 'Take a photo of the screen with your build on it, or pick a screenshot.'),
        area,
      ),
    ],
  };
}
