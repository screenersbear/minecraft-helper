// Listen: hears a question with the phone's speech recognition (webkitSpeechRecognition in Safari).
// On iPhone it has to start from a tap, so the talk button starts it.

const Recognition = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

export const canListen = () => Boolean(Recognition);

// Starts listening for one question. Calls onWords(text) while hearing, then onDone(text) once, or onError(code).
// Returns { stop, finishSoon }: stop() ends listening now and keeps what was heard. finishSoon() is for a finger that
// let go: the phone is often still turning the last words into text, so it keeps listening until no new words have
// come for a moment (quiet ms), but never longer than most ms.
export function listenOnce({ onWords, onDone, onError }) {
  const rec = new Recognition();
  rec.lang = 'en-US';
  rec.interimResults = true;
  rec.continuous = false;
  rec.maxAlternatives = 1;
  let heard = '';
  let finished = false;
  let quietTimer = null;
  let lastTimer = null;
  let quietFor = 0;
  const stop = () => {
    clearTimeout(quietTimer);
    clearTimeout(lastTimer);
    try {
      rec.stop();
    } catch {
      /* already stopped */
    }
  };
  rec.onresult = (event) => {
    heard = Array.from(event.results).map((r) => r[0].transcript).join(' ').trim();
    onWords?.(heard);
    if (quietFor) {
      clearTimeout(quietTimer);
      quietTimer = setTimeout(stop, quietFor);
    }
  };
  rec.onerror = (event) => {
    if (finished) return;
    finished = true;
    onError?.(event.error || 'error');
  };
  rec.onend = () => {
    clearTimeout(quietTimer);
    clearTimeout(lastTimer);
    if (finished) return;
    finished = true;
    if (heard) onDone?.(heard);
    else onError?.('no-speech');
  };
  rec.start();
  const finishSoon = ({ quiet = 1000, most = 3500 } = {}) => {
    quietFor = quiet;
    quietTimer = setTimeout(stop, quiet);
    lastTimer = setTimeout(stop, most);
  };
  return { stop, finishSoon };
}

// Keeps listening for short commands ("next", "again", "back") until stopped. Restarts itself when the phone
// stops listening, unless the phone said no. Calls onHeard(text) for each thing heard, onState(on) when it starts or stops.
export function listenForCommands({ onHeard, onState }) {
  if (!Recognition) return { stop() {} };
  let stopped = false;
  let rec = null;
  let fails = 0;
  const begin = () => {
    if (stopped) return;
    rec = new Recognition();
    rec.lang = 'en-US';
    rec.continuous = true;
    rec.interimResults = false;
    rec.onstart = () => onState?.(true);
    rec.onresult = (event) => {
      fails = 0;
      const last = event.results[event.results.length - 1];
      onHeard?.(last[0].transcript);
    };
    rec.onerror = (event) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') stopped = true;
      fails += 1;
    };
    rec.onend = () => {
      onState?.(false);
      if (!stopped && fails < 3) setTimeout(begin, 300);
    };
    try {
      rec.start();
    } catch {
      stopped = true;
      onState?.(false);
    }
  };
  begin();
  return {
    stop() {
      stopped = true;
      try {
        rec?.abort();
      } catch {
        /* already stopped */
      }
    },
  };
}
