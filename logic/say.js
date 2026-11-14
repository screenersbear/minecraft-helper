// Say: the sentences the app speaks and shows. Short and plain, made only from what's in the book.
import { plural, mobPlural, counted, article, listWords, capitalize } from './plural.js';
import { foodSentence } from './say-facts.js';
import { plainText } from './links.js';

// The name of a recipe cell: "coal", "wood planks", "red mushroom or brown mushroom".
export function cellName(cell, book) {
  return cell
    .split('|')
    .map((id) => (book.items[id]?.name || id.replace(/_/g, ' ')).toLowerCase())
    .join(' or ');
}

// What a recipe needs, in order of first use: [{ cell, count }].
export function needsOf(recipe) {
  const cells = recipe.grid ? recipe.grid.flat() : recipe.slots || [recipe.input];
  const counts = new Map();
  for (const c of cells) if (c) counts.set(c, (counts.get(c) || 0) + 1);
  return [...counts].map(([cell, count]) => ({ cell, count }));
}

// Small enough for the 2 by 2 grid in your inventory?
export function fitsInInventory(recipe) {
  if (recipe.how !== 'crafting') return false;
  if (recipe.shapeless) return recipe.grid.flat().filter(Boolean).length <= 4;
  return recipe.grid.length <= 2 && recipe.grid.every((row) => row.length <= 2);
}

export function recipeSentence(recipe, name, book) {
  const needs = needsOf(recipe).map((n) => counted(n.count, cellName(n.cell, book)));
  const made = recipe.count > 1 ? ` You get ${counted(recipe.count, name)}.` : '';
  if (recipe.how === 'furnace') return `Put ${needs[0]} in a furnace with fuel, like coal.${made || ` You get ${counted(1, name)}.`}`;
  if (recipe.how === 'stonecutter') return `Put ${needs[0]} in a stonecutter and pick ${plural(name)}.${made}`;
  if (recipe.how === 'smithing') {
    const parts = recipe.slots.map((c) => article(cellName(c, book)));
    return `Put ${listWords(parts)} in a smithing table.`;
  }
  const where = fitsInInventory(recipe) ? 'your crafting grid' : 'a crafting table';
  const how = recipe.shapeless ? `Put them anywhere in ${where}.` : `Put them in ${where} like this.`;
  if (needs.length === 1 && recipe.grid.flat().filter(Boolean).length === 1) return `Put ${needs[0]} in ${where}.${made}`;
  return `You need ${listWords(needs)}. ${how}${made}`;
}

// "You get 3 buckets back."
export function backSentence(recipe, book) {
  if (!recipe.back?.length) return '';
  const things = recipe.back.map(([id, n]) => counted(n, book.items[id]?.name || id));
  return `You get ${listWords(things)} back.`;
}

const toolName = (id, book) => (book.items[id]?.name || id.replace(/_/g, ' ')).toLowerCase();

// The tool sentence for a block: "Use an iron pickaxe or better." Any pickaxe needs no sentence of its own.
function toolSentence(tool, book) {
  if (!tool) return '';
  if (tool === 'wooden_pickaxe') return ' Any pickaxe works.';
  return ` Use ${article(toolName(tool, book))} or better.`;
}

// Facts for something you can't craft. kind: the question kind ('mine' asks about the tool).
export function factSentence(id, book, kind) {
  const fact = book.facts[id] || {};
  const name = book.items[id]?.name || id;
  const many = plural(name);
  const parts = [];
  if (kind === 'mine' && fact.mineWith === 'wooden_pickaxe') return `Mine ${name.toLowerCase()} with any pickaxe.`;
  if (kind === 'mine' && fact.mineWith) return `Mine ${name.toLowerCase()} with ${article(toolName(fact.mineWith, book))} or better.`;
  if (kind === 'food' && fact.food) return foodSentence(fact.food);
  const realRecipe = (book.recipes[id] || []).some((r) => !r.unpack);
  if (!realRecipe) parts.push(`You can't craft ${many}.`);
  if (fact.fromBlocks?.length) {
    const blocks = fact.fromBlocks.map((b) => (book.items[b.block]?.name || b.block).toLowerCase());
    const sometimes = fact.fromBlocks.every((b) => b.sometimes);
    const first = fact.fromBlocks[0].block;
    const tool = book.facts[first]?.mineWith;
    parts.push(sometimes ? `Mining ${listWords(blocks)} sometimes gives you ${many}.` : `Mine ${listWords(blocks.slice(0, 2))} to get ${many}.`);
    if (!sometimes) parts.push(toolSentence(tool, book).trim());
  } else if (fact.fromMobs?.length) {
    const mobs = fact.fromMobs.map((m) => mobPlural(book.mobs[m]?.name || m));
    parts.push(`${capitalize(listWords(mobs))} drop ${many}.`);
  } else if (fact.mineWith) {
    parts.push(`Mine it with ${article(toolName(fact.mineWith, book))} or better.`);
  }
  if (fact.food) parts.push(foodSentence(fact.food));
  return parts.filter(Boolean).join(' ');
}

const KIND_SENTENCES = {
  hostile: 'is hostile. It attacks you.',
  neutral: "is neutral. It only attacks if you make it angry.",
  passive: 'is friendly. It never attacks you.',
};

export function mobSentence(id, book) {
  const mob = book.mobs[id];
  const name = mob.name;
  const drops = mob.drops.map((d) => (book.items[d]?.name || d).toLowerCase());
  const dropText = drops.length ? ` When you beat one, it can drop ${listWords(drops)}.` : '';
  if (mob.kind === 'boss') return `The ${name} is a boss. It's a really big fight.${dropText.replace('beat one', 'beat it')}`;
  return `${capitalize(article(name))} ${KIND_SENTENCES[mob.kind]}${dropText}`;
}

// What's read out for a guide step.
export const stepSentence = (step, number) => `Step ${number}. ${step.title}. ${plainText(step.say)}`;

// A question as heard, tidied for lists: "how do I make a cake" -> "How do I make a cake?"
export function tidyQuestion(question) {
  const q = String(question || '').trim().replace(/\s+/g, ' ');
  if (!q) return '';
  const capital = q[0].toUpperCase() + q.slice(1);
  return /[?.!]$/.test(capital) ? capital : `${capital}?`;
}

// The "You asked: ..." line: "How do I make a cake" -> "You asked: how do I make a cake?"
export function askedLine(question) {
  const q = tidyQuestion(question);
  if (!q) return '';
  return `You asked: ${/^I\b/.test(q) ? q : q[0].toLowerCase() + q.slice(1)}`;
}
