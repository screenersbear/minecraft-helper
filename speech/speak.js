// Speak: reads answers out loud with the phone's own voice (speechSynthesis). Works offline on iPhone.

const LIKED = ['Samantha', 'Karen', 'Daniel', 'Moira', 'Tessa', 'Serena', 'Ava', 'Allison', 'Susan', 'Google US English'];
// Joke voices that come with Apple devices: never pick these.
const SKIP = /bad news|bahh|bells|boing|bubbles|cellos|deranged|good news|hysterical|jester|organ|superstar|trinoids|whisper|wobble|zarvox|albert|fred|junior|ralph|kathy|grandma|grandpa|eddy|flo|reed|rocko|sandy|shelley/i;

let voice = null;
let unlocked = false;
let talking = false;
let stoppedAt = 0;

function chooseVoice() {
  const voices = window.speechSynthesis?.getVoices() || [];
  const english = voices.filter((v) => /^en[-_]/i.test(v.lang) && !SKIP.test(v.name));
  voice = LIKED.map((n) => english.find((v) => v.name.startsWith(n))).find(Boolean)
    || english.find((v) => /en[-_]US/i.test(v.lang) && v.localService)
    || english[0]
    || null;
}

export const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

if (canSpeak()) {
  chooseVoice();
  window.speechSynthesis.addEventListener?.('voiceschanged', chooseVoice);
}

// iPhone only lets a page talk after a tap. Call this from the first tap so later answers can be spoken.
export function unlockSpeech() {
  if (unlocked || !canSpeak()) return;
  unlocked = true;
  const hush = new SpeechSynthesisUtterance(' ');
  hush.volume = 0;
  window.speechSynthesis.speak(hush);
}

export function stopSpeaking() {
  if (canSpeak()) window.speechSynthesis.cancel();
}

// Says the text. onDone runs when it has finished (or straight away if the phone can't talk).
export function speak(text, onDone) {
  if (!canSpeak() || !text) {
    onDone?.();
    return;
  }
  // Safari can drop a line spoken straight after cancel(), so wait a moment when something was still talking.
  const busy = window.speechSynthesis.speaking || window.speechSynthesis.pending;
  stopSpeaking();
  const line = new SpeechSynthesisUtterance(text);
  if (voice) line.voice = voice;
  line.lang = voice?.lang || 'en-US';
  line.rate = 0.95;
  let done = false;
  talking = true;
  const finish = () => {
    if (done) return;
    done = true;
    talking = false;
    stoppedAt = Date.now();
    onDone?.();
  };
  line.onend = finish;
  line.onerror = finish;
  if (busy) setTimeout(() => window.speechSynthesis.speak(line), 120);
  else window.speechSynthesis.speak(line);
}

// True while the app is talking and for a moment after, so the guide doesn't hear its own voice say "next".
export const recentlySpoke = (ms = 700) => talking || Date.now() - stoppedAt < ms;
