// Asking the add-ons from Ask (the first page): which add-on answer, if any, a question goes to. Only add-ons that
// are turned on are asked. The regular game comes first: an add-on only gets a question that says its name, or one
// the regular game can't answer that names something only the add-on has (its "ownWords": "what is a harpoon").
// So "how do I make a boat" never lands on the Bloop's submarine, and "is there a boss" stays in the regular game.
import { keyWords } from './words.js';
import { findInAddon } from './addon-search.js';

// The add-on a question names: every word of its name said ("how do I get out of the bloop" names The Bloop).
export function namedAddon(packs, question) {
  const said = new Set(keyWords(question));
  return (packs || []).find((pack) => {
    const name = keyWords(pack.name);
    return name.length > 0 && name.every((w) => said.has(w));
  }) || null;
}

// For a question the regular game can't answer: { pack, id } of the add-on answer about the thing only an add-on
// has that the question names ("can I ride a submarine"). Null when it names none.
export function addonOnly(packs, question) {
  const said = new Set(keyWords(question));
  for (const pack of packs || []) {
    const own = (pack.ownWords || []).flatMap((w) => keyWords(w)).filter((w) => said.has(w));
    const id = own.length ? findInAddon(pack, own.join(' ')) : null;
    if (id && pack.answers[id]) return { pack, id };
  }
  return null;
}
