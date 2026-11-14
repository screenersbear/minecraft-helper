// Photo button: a big button that opens the camera or the photo library. The invisible file box inside it
// does the opening, so it works with one tap on a phone.
import { el } from './el.js';
import { icon } from './icons.js';

// camera: true opens the camera first. onPhoto(file): a photo was taken or picked.
export function photoButton({ label, pic, tone, camera, onPhoto }) {
  const input = el('input', { type: 'file', accept: 'image/*', class: 'file-input', capture: camera ? 'environment' : null });
  input.addEventListener('change', () => input.files?.[0] && onPhoto(input.files[0]));
  return el('label', { class: `photo-btn notch tone-${tone}` }, icon(pic, 36), el('span', {}, label), input);
}

// The two buttons side by side: Take a photo and Pick a photo.
export const photoButtons = (onPhoto) =>
  el(
    'div',
    { class: 'photo-row' },
    photoButton({ label: 'Take a photo', pic: 'camera', tone: 'mango', camera: true, onPhoto }),
    photoButton({ label: 'Pick a photo', pic: 'photo', tone: 'grey', camera: false, onPhoto }),
  );
