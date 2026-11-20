import './_setup.mjs';
import { describe, it, expect } from 'vitest';
import { cellName, needsOf, fitsInInventory, recipeSentence, backSentence, factSentence, mobSentence, stepSentence, tidyQuestion, askedLine } from '../../logic/say.js';
import { placeName, biomeSentence, enchantSentence, effectSentence, drumsticks, foodSentence } from '../../logic/say-facts.js';
import { missingSentence, missingLabel, knownSentence } from '../../logic/say-missing.js';
import { realData } from './_setup.mjs';

const book = {
  items: {
    coal: { name: 'Coal' }, charcoal: { name: 'Charcoal' }, stick: { name: 'Stick' }, torch: { name: 'Torch' }, sugar: { name: 'Sugar' },
    iron_ingot: { name: 'Iron Ingot' }, raw_iron: { name: 'Raw Iron' }, iron_ore: { name: 'Iron Ore' }, bucket: { name: 'Bucket' },
    stone_pickaxe: { name: 'Stone Pickaxe' }, iron_pickaxe: { name: 'Iron Pickaxe' }, diamond: { name: 'Diamond' }, diamond_ore: { name: 'Diamond Ore' },
    deepslate_diamond_ore: { name: 'Deepslate Diamond Ore' }, flint: { name: 'Flint' }, gravel: { name: 'Gravel' }, blaze_rod: { name: 'Blaze Rod' },
    apple: { name: 'Apple' }, obsidian: { name: 'Obsidian' }, dirt: { name: 'Dirt' }, cobblestone: { name: 'Cobblestone' }, oak_planks: { name: 'Oak Planks' },
    rotten_flesh: { name: 'Rotten Flesh' }, cake: { name: 'Cake' }, netherite_upgrade: { name: 'Netherite Upgrade' },
  },
  mobs: {
    zombie: { name: 'Zombie', kind: 'hostile', drops: ['rotten_flesh', 'iron_ingot'] },
    wolf: { name: 'Wolf', kind: 'neutral', drops: [] },
    cat: { name: 'Cat', kind: 'passive', drops: ['string'] },
    ender_dragon: { name: 'Ender Dragon', kind: 'boss', drops: ['dragon_egg'] },
    wither: { name: 'Wither', kind: 'boss', drops: [] },
    blaze: { name: 'Blaze' }, chicken: { name: 'Chicken' },
  },
  recipes: {
    iron_ingot: [{ how: 'furnace', input: 'raw_iron', count: 1 }, { how: 'crafting', unpack: true, grid: [['iron_block']], count: 9 }],
    diamond: [{ how: 'crafting', unpack: true, grid: [['diamond_block']], count: 9 }],
    cake: [{ how: 'crafting', grid: [['sugar', 'sugar']], count: 1 }],
  },
  facts: {
    iron_ore: { mineWith: 'stone_pickaxe' },
    diamond_ore: { mineWith: 'iron_pickaxe' },
    dirt: {}, cobblestone: { mineWith: 'wooden_pickaxe' }, obsidian: { mineWith: 'diamond_pickaxe' },
    diamond: { fromBlocks: [{ block: 'diamond_ore' }, { block: 'deepslate_diamond_ore' }, { block: 'x' }] },
    raw_iron: { fromBlocks: [{ block: 'iron_ore' }] },
    stone_dust: { fromBlocks: [{ block: 'cobblestone' }] },
    pebble: { fromBlocks: [{ block: 'dirt' }] },
    flint: { fromBlocks: [{ block: 'gravel', sometimes: true }, { block: 'dirt', sometimes: true }] },
    blaze_rod: { fromMobs: ['blaze'] },
    feather: { fromMobs: ['chicken', 'parrot'] },
    apple: { food: { points: 4 } },
  },
};

describe('cellName', () => {
  it('a name from the book, or from the id', () => {
    expect(cellName('coal', book)).toBe('coal');
    expect(cellName('red_mushroom', book)).toBe('red mushroom');
  });
  it('several choices', () => expect(cellName('coal|charcoal', book)).toBe('coal or charcoal'));
  it('an empty cell', () => expect(cellName('', book)).toBe(''));
});

describe('needsOf', () => {
  it('counts a grid in order of first use, skipping empty cells', () => {
    expect(needsOf({ grid: [['coal', null], ['stick', 'coal'], ['', 'stick']] })).toEqual([{ cell: 'coal', count: 2 }, { cell: 'stick', count: 2 }]);
  });
  it('smithing slots and a furnace input', () => {
    expect(needsOf({ slots: ['a', 'b', 'a'] })).toEqual([{ cell: 'a', count: 2 }, { cell: 'b', count: 1 }]);
    expect(needsOf({ input: 'raw_iron' })).toEqual([{ cell: 'raw_iron', count: 1 }]);
  });
  it('nothing needed', () => expect(needsOf({ grid: [[null]] })).toEqual([]));
});

describe('fitsInInventory', () => {
  it('only crafting', () => expect(fitsInInventory({ how: 'furnace' })).toBe(false));
  it('shapeless: up to 4 things', () => {
    expect(fitsInInventory({ how: 'crafting', shapeless: true, grid: [['a', 'b', 'c', 'd', null]] })).toBe(true);
    expect(fitsInInventory({ how: 'crafting', shapeless: true, grid: [['a', 'b', 'c'], ['d', 'e']] })).toBe(false);
  });
  it('shaped: 2 by 2 at most', () => {
    expect(fitsInInventory({ how: 'crafting', grid: [['a', 'b'], ['c', 'd']] })).toBe(true);
    expect(fitsInInventory({ how: 'crafting', grid: [['a'], ['b'], ['c']] })).toBe(false);
    expect(fitsInInventory({ how: 'crafting', grid: [['a', 'b', 'c']] })).toBe(false);
  });
});

describe('recipeSentence', () => {
  it('a furnace, making one or many', () => {
    expect(recipeSentence({ how: 'furnace', input: 'raw_iron', count: 1 }, 'Iron Ingot', book)).toBe('Put 1 raw iron in a furnace with fuel, like coal. You get 1 iron ingot.');
    expect(recipeSentence({ how: 'furnace', input: 'raw_iron', count: 2 }, 'Iron Ingot', book)).toBe('Put 1 raw iron in a furnace with fuel, like coal. You get 2 iron ingots.');
  });
  it('a stonecutter', () => {
    expect(recipeSentence({ how: 'stonecutter', input: 'cobblestone', count: 1 }, 'Cobblestone Stairs', book)).toBe('Put 1 cobblestone in a stonecutter and pick cobblestone stairs.');
    expect(recipeSentence({ how: 'stonecutter', input: 'cobblestone', count: 2 }, 'Cobblestone Slab', book)).toBe('Put 1 cobblestone in a stonecutter and pick cobblestone slabs. You get 2 cobblestone slabs.');
  });
  it('a smithing table', () => {
    expect(recipeSentence({ how: 'smithing', slots: ['netherite_upgrade', 'diamond_sword', 'netherite_ingot'], count: 1 }, 'Netherite Sword', book))
      .toBe('Put a netherite upgrade, a diamond sword and a netherite ingot in a smithing table.');
  });
  it('one thing on its own', () => {
    expect(recipeSentence({ how: 'crafting', grid: [['oak_log']], count: 4 }, 'Oak Planks', book)).toBe('Put 1 oak log in your crafting grid. You get 4 oak planks.');
  });
  it('a shaped recipe on a crafting table', () => {
    expect(recipeSentence({ how: 'crafting', grid: [['coal', 'coal', 'coal'], ['stick', null, null]], count: 1 }, 'Thing', book))
      .toBe('You need 3 coal and 1 stick. Put them in a crafting table like this.');
  });
  it('a shapeless recipe in the crafting grid', () => {
    expect(recipeSentence({ how: 'crafting', shapeless: true, grid: [['coal|charcoal', 'stick']], count: 4 }, 'Torch', book))
      .toBe('You need 1 coal or charcoal and 1 stick. Put them anywhere in your crafting grid. You get 4 torches.');
  });
  it('two of the same thing is not "on its own"', () => {
    expect(recipeSentence({ how: 'crafting', grid: [['sugar', 'sugar']], count: 1 }, 'Cake', book)).toBe('You need 2 sugar. Put them in your crafting grid like this.');
  });
});

describe('backSentence', () => {
  it('what you get back', () => {
    expect(backSentence({ back: [['bucket', 3]] }, book)).toBe('You get 3 buckets back.');
    expect(backSentence({ back: [['bucket', 1], ['glass_bottle', 2]] }, book)).toBe('You get 1 bucket and 2 glass_bottles back.');
  });
  it('nothing back', () => {
    expect(backSentence({}, book)).toBe('');
    expect(backSentence({ back: [] }, book)).toBe('');
  });
});

describe('factSentence', () => {
  it('mining questions', () => {
    expect(factSentence('cobblestone', book, 'mine')).toBe('Mine cobblestone with any pickaxe.');
    expect(factSentence('iron_ore', book, 'mine')).toBe('Mine iron ore with a stone pickaxe or better.');
    expect(factSentence('obsidian', book, 'mine')).toBe('Mine obsidian with a diamond pickaxe or better.');
  });
  it('a mining question about a thing with no tool gives the facts', () => expect(factSentence('dirt', book, 'mine')).toBe("You can't craft dirt."));
  it('food questions', () => {
    expect(factSentence('apple', book, 'food')).toBe('It fills 2 drumsticks on your hunger bar.');
    expect(factSentence('apple', book)).toBe("You can't craft apples. It fills 2 drumsticks on your hunger bar.");
  });
  it('mined from blocks, with the tool', () => {
    expect(factSentence('diamond', book)).toBe("You can't craft diamonds. Mine diamond ore and deepslate diamond ore to get diamonds. Use an iron pickaxe or better.");
    expect(factSentence('raw_iron', book)).toBe("You can't craft raw iron. Mine iron ore to get raw iron. Use a stone pickaxe or better.");
    expect(factSentence('stone_dust', book)).toBe("You can't craft stone_dusts. Mine cobblestone to get stone_dusts. Any pickaxe works.");
    expect(factSentence('pebble', book)).toBe("You can't craft pebbles. Mine dirt to get pebbles.");
  });
  it('sometimes from blocks', () => expect(factSentence('flint', book)).toBe("You can't craft flint. Mining gravel and dirt sometimes gives you flint."));
  it('dropped by mobs', () => {
    expect(factSentence('blaze_rod', book)).toBe("You can't craft blaze rods. Blazes drop blaze rods.");
    expect(factSentence('feather', book)).toBe("You can't craft feathers. Chickens and parrots drop feathers.");
  });
  it('mined with a tool', () => expect(factSentence('iron_ore', book)).toBe("You can't craft iron ores. Mine it with a stone pickaxe or better."));
  it('a thing with a real recipe does not say you cannot craft it', () => expect(factSentence('iron_ingot', book)).toBe(''));
  it('a thing the book has nothing on', () => expect(factSentence('mystery', book)).toBe("You can't craft mysteries."));
});

describe('mobSentence', () => {
  it('hostile, with drops', () => expect(mobSentence('zombie', book)).toBe('A zombie is hostile. It attacks you. When you beat one, it can drop rotten flesh and iron ingot.'));
  it('neutral with no drops', () => expect(mobSentence('wolf', book)).toBe('A wolf is neutral. It only attacks if you make it angry.'));
  it('friendly, a drop not in the items', () => expect(mobSentence('cat', book)).toBe('A cat is friendly. It never attacks you. When you beat one, it can drop string.'));
  it('a boss', () => {
    expect(mobSentence('ender_dragon', book)).toBe("The Ender Dragon is a boss. It's a really big fight. When you beat it, it can drop dragon_egg.");
    expect(mobSentence('wither', book)).toBe("The Wither is a boss. It's a really big fight.");
  });
});

describe('stepSentence', () => {
  it('number, title and plain words', () => expect(stepSentence({ title: 'Make fences', say: 'Use [sticks](item:stick).' }, 2)).toBe('Step 2. Make fences. Use sticks.'));
  it('empty words', () => expect(stepSentence({ title: 'Done', say: '' }, 1)).toBe('Step 1. Done. '));
});

describe('tidyQuestion and askedLine', () => {
  it('capital and question mark', () => {
    expect(tidyQuestion('  how do I   make a cake ')).toBe('How do I make a cake?');
    expect(tidyQuestion('Wow!')).toBe('Wow!');
    expect(tidyQuestion('ok.')).toBe('Ok.');
  });
  it('empty', () => {
    expect(tidyQuestion('')).toBe('');
    expect(tidyQuestion(null)).toBe('');
    expect(askedLine('   ')).toBe('');
  });
  it('you asked', () => {
    expect(askedLine('How do I make a cake')).toBe('You asked: how do I make a cake?');
    expect(askedLine('I want a cake')).toBe('You asked: I want a cake?');
    expect(askedLine('Is it safe')).toBe('You asked: is it safe?');
  });
});

describe('say facts', () => {
  const b = {
    biomes: {
      taiga: { name: 'Taiga', weather: 'rain-snow-high', snowy: 'snowy_taiga', world: 'overworld' },
      snowy_taiga: { name: 'Snowy Taiga', weather: 'snow', snowy: 'snowy_taiga', world: 'overworld' },
      beach: { name: 'Beach', weather: 'rain', snowy: 'snowy_beach', world: 'overworld' },
      snowy_beach: { name: 'Snowy Beach', weather: 'snow' },
      desert: { name: 'Desert', weather: 'dry', world: 'overworld' },
      lush_caves: { name: 'Lush Caves', weather: 'cave', world: 'overworld' },
      deep_dark: { name: 'Deep Dark', weather: 'cave', world: 'overworld' },
      nether_wastes: { name: 'Nether Wastes', weather: 'dry', world: 'nether' },
      soul_sand_valley: { name: 'Soul Sand Valley', weather: 'dry', world: 'nether' },
      the_end: { name: 'The End', weather: 'dry', world: 'end' },
    },
    enchants: {
      sharpness: { name: 'Sharpness', on: 'swords and axes', what: 'It does more damage.', max: 5 },
      mending: { name: 'Mending', on: 'anything', what: 'XP fixes it.', max: 1, treasure: true },
    },
    effects: { speed: { name: 'Speed', good: true, what: 'You run faster.' }, poison: { name: 'Poison', good: false, what: 'It hurts you.' } },
  };
  it('place names', () => {
    expect(placeName('Taiga')).toBe('the taiga');
    expect(placeName('Nether Wastes')).toBe('the Nether wastes');
    expect(placeName('The End')).toBe('the End');
    expect(placeName('The Void')).toBe('the void');
  });
  it('biome weather', () => {
    expect(biomeSentence('taiga', b)).toBe('It rains in the taiga. Way up high, it snows instead. In the snowy taiga, it snows.');
    expect(biomeSentence('snowy_taiga', b)).toBe('It snows in the snowy taiga.');
    expect(biomeSentence('beach', b)).toBe('It rains on the beach, but it never snows. On the snowy beach, it snows.');
    expect(biomeSentence('desert', b)).toBe('It never rains or snows in the desert.');
  });
  it('caves', () => {
    expect(biomeSentence('lush_caves', b)).toBe("The lush caves are under the ground, so rain and snow can't get there.");
    expect(biomeSentence('deep_dark', b)).toBe("The deep dark is under the ground, so rain and snow can't get there.");
  });
  it('the Nether and the End', () => {
    expect(biomeSentence('nether_wastes', b)).toBe('It never rains or snows in the Nether wastes.');
    expect(biomeSentence('soul_sand_valley', b)).toBe("It never rains or snows in the soul sand valley. It's in the Nether.");
    expect(biomeSentence('the_end', b)).toBe('It never rains or snows in the End.');
  });
  it('enchantments', () => {
    expect(enchantSentence('sharpness', b)).toBe('Sharpness goes on swords and axes. It does more damage. It goes up to level 5.');
    expect(enchantSentence('sharpness', b, 'max')).toBe('Sharpness goes up to level 5. It goes on swords and axes.');
    expect(enchantSentence('mending', b)).toBe("Mending goes on anything. XP fixes it. It has just one level. You can't get it from an enchanting table. Look in chests, or trade for it.");
    expect(enchantSentence('mending', b, 'max')).toBe('Mending goes up to level 1. It goes on anything.');
  });
  it('effects', () => {
    expect(effectSentence('speed', b)).toBe('Speed is a good effect: you run faster.');
    expect(effectSentence('poison', b)).toBe('Poison is a bad effect: it hurts you.');
  });
  it('drumsticks', () => {
    expect(drumsticks(0)).toBe('half a drumstick');
    expect(drumsticks(1)).toBe('half a drumstick');
    expect(drumsticks(2)).toBe('1 drumstick');
    expect(drumsticks(3)).toBe('1 and a half drumsticks');
    expect(drumsticks(8)).toBe('4 drumsticks');
    expect(drumsticks(20)).toBe('10 drumsticks');
  });
  it('food', () => {
    expect(foodSentence({ points: 8, full: 'long' })).toBe('It fills 4 drumsticks on your hunger bar and keeps you full a long time.');
    expect(foodSentence({ points: 8, full: 'long', note: 'You stay full.' })).toBe('It fills 4 drumsticks on your hunger bar. You stay full.');
    expect(foodSentence({ points: 2, full: 'short' })).toBe("It fills 1 drumstick on your hunger bar, but you'll be hungry again soon.");
    expect(foodSentence({ points: 2, full: 'short', note: 'You get hungry fast.' })).toBe('It fills 1 drumstick on your hunger bar. You get hungry fast.');
    expect(foodSentence({ points: 1 })).toBe('It fills half a drumstick on your hunger bar.');
  });
  it('every real biome, enchantment and effect has a sentence', () => {
    const { book: real } = realData();
    for (const id of Object.keys(real.biomes)) expect(biomeSentence(id, real), id).toMatch(/\.$/);
    for (const id of Object.keys(real.enchants)) expect(enchantSentence(id, real), id).toMatch(/level/);
    for (const id of Object.keys(real.effects)) expect(effectSentence(id, real), id).toMatch(/effect: /);
  });
});

describe('say missing', () => {
  it('missing sentences', () => {
    expect(missingSentence('Panda', 'mob')).toBe("I don't know that about pandas yet.");
    expect(missingSentence('Chicken', 'mob')).toBe("I don't know that about chickens yet.");
    expect(missingSentence('Chicken')).toBe("I don't know that about chicken yet.");
    expect(missingSentence('Village', 'place')).toBe("I don't know that about villages yet.");
  });
  it('missing labels', () => {
    expect(missingLabel('Cat', 'What GIFTS?')).toBe('Missing: cat, what gifts');
    expect(missingLabel('Cat', '', 'gifts')).toBe('Missing: cat, gifts');
    expect(missingLabel('Cat', '')).toBe('Missing: cat, something');
  });
  const known = { ...book, fields: { mob: { cat: { where: { say: 'In [villages](place:village).' } } } }, places: {} };
  it('what the app does know', () => {
    expect(knownSentence({ type: 'mob', id: 'wolf' }, 'mob', known, 'Wolf')).toBe('A wolf is neutral. It only attacks if you make it angry.');
    expect(knownSentence({ type: 'item', id: 'blaze_rod' }, 'fact', known, 'Blaze Rod')).toBe("You can't craft blaze rods. Blazes drop blaze rods.");
    expect(knownSentence({ type: 'mob', id: 'cat' }, 'where', known, 'Cat')).toBe('In [villages](place:village).');
    expect(knownSentence({ type: 'mob', id: 'dog' }, 'where', known, 'Dog')).toBe('');
  });
  it('a recipe, preferring a real one to unpacking', () => {
    expect(knownSentence({ type: 'item', id: 'iron_ingot' }, 'recipe', known, 'Iron Ingot')).toBe('Put 1 raw iron in a furnace with fuel, like coal. You get 1 iron ingot.');
    expect(knownSentence({ type: 'item', id: 'diamond' }, 'unpack', known, 'Diamond')).toBe('Put 1 diamond block in your crafting grid. You get 9 diamonds.');
    expect(knownSentence({ type: 'item', id: 'none' }, 'recipe', known, 'None')).toBe('');
  });
  it('other types know nothing', () => expect(knownSentence({ type: 'guide', id: 'x' }, 'guide', known, 'X')).toBe(''));
});
