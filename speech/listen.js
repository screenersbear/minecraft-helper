// Listen: hears a question with the phone's speech recognition (webkitSpeechRecognition in Safari).
// On iPhone it has to start from a tap, so the talk button starts it.

const Recognition = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

export const canListen = () => Boolean(Recognition);

// Starts listening for one question. Calls onWords(text) while hearing, then onDone(text) once, or onError(code).
// Returns { stop }: stop() ends listening and keeps what was heard.
export function listenOnce({ onWords, onDone, onError }) {
  const rec = new Recognition();
  rec.lang = 'en-US';
  rec.interimResults = true;
  rec.continuous = false;
  rec.maxAlternatives = 1;
  let heard = '';
  let finished = false;
  rec.onresult = (event) => {
    heard = Array.from(event.results).map((r) => r[0].transcript).join(' ').trim();
    onWords?.(heard);
  };
  rec.onerror = (event) => {
    if (finished) return;
    finished = true;
    onError?.(event.error || 'error');
  };
  rec.onend = () => {
    if (finished) return;
    finished = true;
    if (heard) onDone?.(heard);
    else onError?.('no-speech');
  };
  rec.start();
  return { stop: () => rec.stop() };
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
