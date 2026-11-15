// One of My builds (#/mine/<id>): the photo big, its name and the day it was saved. Delete asks twice, so a slip of
// the finger doesn't lose it.
import { el } from '../components/el.js';
import { topBar } from '../components/top-bar.js';
import { blockButton } from '../components/buttons.js';
import { myBuildById, removeMyBuild } from '../data/my-builds.js';

const dayOf = (time) => new Date(time).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });

export function minePhotoPage(ctx, route) {
  const build = myBuildById(route.id);
  if (!build) return null;
  let sure = false;
  // Delete really throws the photo away, so the click-everything test leaves it alone (data-test-skip).
  const remove = blockButton({
    label: 'Delete',
    tone: 'grey',
    extra: { 'data-test-skip': 'deletes a saved photo' },
    onClick: () => {
      if (!sure) {
        sure = true;
        remove.textContent = 'Tap again to delete';
        return;
      }
      removeMyBuild(build.id);
      ctx.go('#/mine', { replace: true });
    },
  });
  return {
    title: build.name,
    nodes: [
      ...topBar({ back: '#/mine', right: 'My builds' }, ctx),
      el(
        'div',
        { class: 'page make mine-photo' },
        el('img', { class: 'idea-photo', src: build.photo, alt: build.name }),
        el('h1', { class: 'page-title', tabindex: '-1' }, build.name),
        el('p', { class: 'small-label' }, `Saved on ${dayOf(build.made)}`),
        el('div', { class: 'bottom' }, el('div', { class: 'two-up' }, blockButton({ label: 'Back', tone: 'grey', href: '#/mine' }), remove)),
      ),
    ],
  };
}
