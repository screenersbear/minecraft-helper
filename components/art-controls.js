// The pixel art's settings: a Fewer / More colours slider, and Outline and Wool only switches.
// Each change is handed to the page, which makes the blocks again.
import { el } from './el.js';
import { COLOURS } from '../logic/pixel-convert.js';

const toggle = (label, on, onChange) => {
  const button = el('button', { class: 'switch-btn toggle-btn', type: 'button', 'aria-pressed': String(on) }, label);
  button.addEventListener('click', () => {
    const next = button.getAttribute('aria-pressed') !== 'true';
    button.setAttribute('aria-pressed', String(next));
    onChange(next);
  });
  return button;
};

// look: { colours, outline, woolOnly }. canOutline: false hides Outline (no background to draw it on).
export function artControls(look, canOutline, { onColours, onOutline, onWool }) {
  const count = el('output', { class: 'colour-count', for: 'colours' }, String(look.colours));
  const slider = el('input', {
    id: 'colours',
    class: 'colour-slider',
    type: 'range',
    min: String(COLOURS.fewest),
    max: String(COLOURS.most),
    step: '1',
    value: String(look.colours),
    'aria-label': 'Colours',
  });
  slider.addEventListener('input', () => {
    count.textContent = slider.value;
    onColours(Number(slider.value));
  });
  return el(
    'div',
    { class: 'art-controls' },
    el('div', { class: 'colours-head' }, el('label', { class: 'small-label', for: 'colours' }, 'Colours'), count),
    el('div', { class: 'colours-row' }, el('span', { 'aria-hidden': 'true' }, 'Fewer'), slider, el('span', { 'aria-hidden': 'true' }, 'More')),
    el(
      'div',
      { class: canOutline ? 'two-up' : 'one-up' },
      canOutline ? toggle('Outline', look.outline, onOutline) : null,
      toggle('Wool only', look.woolOnly, onWool),
    ),
  );
}
