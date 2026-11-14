// Voice commands in a guide: "next", "again" or "back" (and a few other ways kids say them).

const COMMANDS = [
  { command: 'back', words: ['back', 'previous', 'before', 'last one', 'go back'] },
  { command: 'again', words: ['again', 'repeat', 'one more time', 'say that'] },
  { command: 'next', words: ['next', 'continue', 'go on', 'keep going', 'done', 'ok next', 'okay next', 'forward', 'skip'] },
];

// Said on their own, these mean "say it again". In a question ("what gifts?") they don't.
const ALONE = new Set(['what', 'huh', 'pardon', 'what what']);

// The command in what was heard, or null. When several are heard, the last one said counts.
export function parseCommand(text) {
  const heard = ` ${String(text || '').toLowerCase().replace(/[^a-z ]/g, ' ')} `;
  if (ALONE.has(heard.trim().replace(/\s+/g, ' '))) return 'again';
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
