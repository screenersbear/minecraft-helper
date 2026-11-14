// Build pictures: the small 3D view of a finished build, drawn on a canvas from the block pictures in
// images/build-blocks.png (Pixel Perfection CE). Drawing happens a little after the page shows, one picture at a
// time, so swiping stays smooth. Pictures already drawn are kept, so coming back is instant.
import { el } from './el.js';
import { sceneOf } from '../logic/build-scene.js';
import { drawScene, isoSize } from '../logic/iso.js';

let atlas = null;
// The block pictures, as { image, data }: the image for drawing squares, the pixels for the 3D view.
export function loadBlockAtlas() {
  atlas ||= new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const g = canvas.getContext('2d');
      if (!g) return reject(new Error('No canvas'));
      g.drawImage(image, 0, 0);
      resolve({ image, data: g.getImageData(0, 0, image.width, image.height) });
    };
    image.onerror = reject;
    image.src = 'images/build-blocks.png';
  });
  return atlas;
}

const drawn = new Map();
const queue = [];
let busy = false;
function work() {
  const job = queue.shift();
  if (!job) {
    busy = false;
    return;
  }
  job();
  setTimeout(work, 0);
}
const later = (job) => {
  queue.push(job);
  if (!busy) {
    busy = true;
    setTimeout(work, 0);
  }
};

// A canvas showing the build, fitting a box of w by h CSS pixels (sharp on phones with dense screens). label: what
// a screen reader says; '' when the name is already beside it.
export function buildPicture(build, looks, { w, h, label }) {
  const scene = sceneOf(build, looks);
  const dense = Math.min(3, window.devicePixelRatio || 1);
  const s = Math.min((w * dense) / ((scene.W + scene.D) * 16), (h * dense) / ((scene.W + scene.D) * 8 + scene.H * 16));
  const { width, height } = isoSize(scene.W, scene.H, scene.D, s);
  const canvas = el('canvas', {
    class: 'build-picture',
    width,
    height,
    ...(label === '' ? { 'aria-hidden': 'true' } : { role: 'img', 'aria-label': label || `The finished ${build.name.toLowerCase()}` }),
    style: { width: `${width / dense}px`, height: `${height / dense}px` },
  });
  const key = `${build.id}:${width}x${height}`;
  const paint = (pic) => canvas.getContext('2d')?.putImageData(new ImageData(pic.data, pic.width, pic.height), 0, 0);
  if (drawn.has(key)) paint(drawn.get(key));
  else {
    loadBlockAtlas().then(
      ({ data }) => later(() => {
        const pic = drawn.get(key) || drawScene(scene, s, { data: data.data, width: data.width });
        drawn.set(key, pic);
        paint(pic);
      }),
      () => {},
    );
  }
  return canvas;
}
