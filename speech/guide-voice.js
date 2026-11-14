// Guide voice: listens for "next", "again" and "back" while a guide is open. One listener stays on for the
// whole guide (the phone may only allow starting it once), and it ignores what it hears while the app is talking.
import { canListen, listenForCommands } from './listen.js';
import { recentlySpoke } from './speak.js';

let listener = null;
let guideId = null;
let handlers = {};

export const guideVoice = {
  on: false,
  // handlers: { onCommand(text), onState(on) }. Each step gives new handlers; the listener carries on.
  use(id, nextHandlers) {
    handlers = nextHandlers;
    if (!canListen() || (guideId === id && listener)) return;
    guideVoice.stop();
    guideId = id;
    listener = listenForCommands({
      onHeard: (text) => {
        if (!recentlySpoke()) handlers.onCommand?.(text);
      },
      onState: (on) => {
        guideVoice.on = on;
        handlers.onState?.(on);
      },
    });
  },
  stop() {
    listener?.stop();
    listener = null;
    guideId = null;
    guideVoice.on = false;
  },
};
