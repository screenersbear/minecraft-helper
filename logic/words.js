// Words: turns a question into simple words the app can compare ("How do I make TORCHES?" -> how do i make torch).

// Lowercase, no punctuation, apostrophes dropped ("jack o'lantern" -> jack o lantern).
export function cleanText(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function splitWords(text) {
  const clean = cleanText(text);
  return clean ? clean.split(' ') : [];
}

// Plural to singular, so "torches" matches "torch". Same rule on both sides, so it doesn't have to be perfect English.
const KEEP = new Set(['glass', 'grass', 'moss', 'compass', 'bass', 'cactus', 'lapis', 'lazuli', 'bus', 'is', 'its', 'this', 'chorus', 'nautilus', 'christmas']);
const IRREGULAR = {
  wolves: 'wolf', leaves: 'leaf', loaves: 'loaf', shelves: 'shelf', feet: 'foot', endermen: 'enderman', mice: 'mouse', geese: 'goose',
  men: 'man', golden: 'gold', wooden: 'wood', axes: 'axe', pickaxes: 'pickaxe',
};

export function stem(word) {
  if (IRREGULAR[word]) return IRREGULAR[word];
  if (word.length < 4 || KEEP.has(word)) return word;
  if (word.endsWith('ies')) return `${word.slice(0, -3)}y`;
  if (/(ches|shes|xes|sses)$/.test(word)) return word.slice(0, -2);
  if (word.endsWith('s') && !word.endsWith('ss') && !word.endsWith('us')) return word.slice(0, -1);
  return word;
}

// Words that don't say what the question is about.
const FILLER = new Set(
  (
    'a an the i you we me my our your it its this that these those they them he she him her to of for in on at with and or is are am was be ' +
    'how do does did can could would should will what whats which where wheres who why when there theres some any ' +
    'please hey ok okay so um uh like just really need want get got make made making craft crafting crafted build building ' +
    'create creating minecraft bedrock game guide tell show about one thing things way recipe recipes'
  ).split(' '),
);

export const isFiller = (word) => FILLER.has(word);

// The words that matter, singular: "how do I make torches" -> ["torch"].
export function keyWords(text) {
  return splitWords(text).filter((w) => !isFiller(w)).map(stem);
}

// Every word, singular (filler kept), for matching phrases like "go to the nether".
export function allWords(text) {
  return splitWords(text).map(stem);
}
