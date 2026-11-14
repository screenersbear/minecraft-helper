// Voice commands in a guide: "next", "again" or "back" (and a few other ways kids say them).

const COMMANDS = [
  { command: 'back', words: ['back', 'previous', 'before', 'last one', 'go back'] },
  { command: 'again', words: ['again', 'repeat', 'what', 'huh', 'pardon', 'one more time', 'say that'] },
  { command: 'next', words: ['next', 'continue', 'go on', 'keep going', 'done', 'ok next', 'okay next', 'forward', 'skip'] },
];

// The command in what was heard, or null. When several are heard, the last one said counts.
export function parseCommand(text) {
  const heard = ` ${String(text || '').toLowerCase().replace(/[^a-z ]/g, ' ')} `;
  let best = null;
  let bestAt = -1;
  for (const { command, words } of COMMANDS) {
    for (const w of words) {
      const at = heard.lastIndexOf(` ${w} `);
      if (at > bestAt) {
        best = command;
        bestAt = at;
      }
    }
  }
  return best;
}
