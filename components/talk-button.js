// Talk button: the big green button on the Ask screen. Hold it and talk, let go to ask. Kids let go the moment they
// stop talking, so after letting go it keeps listening a moment for the last words.
// A quick tap works too: it listens until you stop talking, or until you tap again.
// If the phone won't start listening the moment a finger goes down, it switches to tap to talk by itself.
// small: the "Hold to ask more" button at the bottom of an answer. onStart runs when it starts listening, onIdle
// when it stops without a question (so a guide can listen for "next" again). about: what the small button asks
// about ("Hold to ask about The Bloop"); "more" when it's left out. Only made when the device can listen (see
// speech/listen.js): Ask and ask-more show a box to type in instead.
import { el } from './el.js';
import { icon } from './icons.js';
import { listenOnce } from '../speech/listen.js';
import { stopSpeaking, unlockSpeech } from '../speech/speak.js';

const TYPE_INSTEAD = 'You can type your question below instead.';
const MESSAGES = {
  'not-allowed': `The microphone is turned off for this app. ${TYPE_INSTEAD}`,
  'service-not-allowed': `The microphone is turned off for this app. ${TYPE_INSTEAD}`,
  'audio-capture': `The microphone isn't working. ${TYPE_INSTEAD}`,
  network: `I can't hear you right now. ${TYPE_INSTEAD}`,
  'no-speech': "I didn't hear anything. Hold the button and talk.",
  error: 'Something went wrong. Try again, or type it.',
};
const HOLD = 400; // a press longer than this is a hold, shorter is a tap

export function talkButton({ onQuestion, small = false, onStart, onIdle, about = 'more' }) {
  const mic = icon('mic', small ? 36 : 80);
  const button = el('button', { class: `talk-btn${small ? ' talk-small' : ''}`, type: 'button', 'aria-label': 'Hold to talk' }, mic);
  const label = el('div', { class: 'talk-label' });
  const heard = el('p', { class: 'heard', 'aria-live': 'polite' });
  let session = null;
  let mode = 'idle'; // idle, holding, tapped, finishing (let go, catching the last words)
  let pressedAt = 0;
  let tapOnly = false;
  let retryOnRelease = false;

  const show = () => {
    const idle = small ? `${tapOnly ? 'Tap' : 'Hold'} to ask ${about}` : tapOnly ? 'Tap to talk' : 'Hold to talk';
    const text = { idle, holding: 'Listening...', tapped: 'Listening... tap to stop', finishing: 'One moment...' }[mode];
    label.textContent = text;
    button.setAttribute('aria-label', label.textContent);
    button.classList.toggle('is-listening', mode !== 'idle');
    if (mode === 'idle') delete document.body.dataset.listening;
    else document.body.dataset.listening = '1';
  };

  const finish = () => {
    session = null;
    mode = 'idle';
    show();
  };

  function begin(nextMode) {
    stopSpeaking();
    onStart?.();
    heard.textContent = '';
    mode = nextMode;
    show();
    const startedAt = Date.now();
    try {
      session = listenOnce({
        onWords: (text) => (heard.textContent = `"${text}"`),
        onDone: (text) => {
          finish();
          heard.textContent = `"${text}"`;
          onQuestion(text);
        },
        onError: (code) => {
          // Turned down straight away while the finger is still down: try again when it lifts (a tap counts there).
          if (mode === 'holding' && code === 'not-allowed' && !tapOnly && Date.now() - startedAt < 800) {
            tapOnly = true;
            retryOnRelease = true;
            finish();
            return;
          }
          finish();
          heard.textContent = MESSAGES[code] ?? MESSAGES.error;
          onIdle?.();
        },
      });
    } catch {
      finish();
      heard.textContent = MESSAGES.error;
      onIdle?.();
    }
  }

  // What the last finger down did: 'start' listening, 'stop' it, 'wait' to start on lifting, or nothing.
  let downAction = null;
  button.addEventListener('contextmenu', (e) => e.preventDefault());
  button.addEventListener('pointerdown', (e) => {
    downAction = null;
    if (e.button > 0) return;
    if (mode === 'tapped') {
      mode = 'finishing';
      show();
      session?.finishSoon();
      downAction = 'stop';
      return;
    }
    if (mode !== 'idle') return;
    if (tapOnly) {
      downAction = 'wait';
      return;
    }
    button.setPointerCapture?.(e.pointerId);
    pressedAt = Date.now();
    downAction = 'start';
    begin('holding');
  });
  const release = () => {
    const action = downAction;
    downAction = null;
    if (!action || action === 'stop') return;
    if (action === 'wait' || retryOnRelease) {
      retryOnRelease = false;
      if (mode === 'idle') begin('tapped');
      return;
    }
    if (mode !== 'holding') return;
    if (Date.now() - pressedAt >= HOLD) {
      mode = 'finishing';
      show();
      session?.finishSoon();
      unlockSpeech(); // letting go is a tap, so the phone allows the answer to be read out
    } else {
      mode = 'tapped';
      show();
    }
  };
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  // Keyboard: Enter or Space starts and stops listening.
  button.addEventListener('click', (e) => {
    if (e.detail !== 0) return;
    if (mode === 'tapped') session?.stop();
    else if (mode === 'idle') begin('tapped');
  });

  show();
  return { nodes: [button, label, heard], stop: () => session?.stop() };
}
