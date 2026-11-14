// Chapters: how the Guides page is sorted. Each guide names its chapter in its "group" (guides/*.json), and each
// add-on names the chapter its topics go in (data/addons/<id>/pack.json, "chapter"). The order here is the order on
// the Guides page. pic: the block or item on the chapter's tile. about: three examples of what's inside.
export const CHAPTERS = [
  { id: 'getting-started', name: 'Getting started', pic: 'crafting_table', about: 'First night, tools, creepers' },
  { id: 'finding-things', name: 'Finding things', pic: 'diamond', about: 'Diamonds, villages, netherite' },
  { id: 'animals', name: 'Animals', pic: 'lead', about: 'Tame, breed, ride' },
  { id: 'farming', name: 'Farming', pic: 'wheat', about: 'Crops, bees, chickens' },
  { id: 'ocean', name: 'Ocean', pic: 'heart_of_the_sea', about: 'Axolotls, boats, fishing' },
  { id: 'building', name: 'Building', pic: 'bricks', about: 'Light, maps, minecarts' },
  { id: 'redstone', name: 'Redstone', pic: 'redstone', about: 'Doors, lamps, music' },
  { id: 'nether-and-end', name: 'Nether and End', pic: 'ender_eye', about: 'Portals, blaze rods, dragon' },
  { id: 'magic', name: 'Magic', pic: 'enchanting_table', about: 'Enchanting, potions, beacons' },
  { id: 'villagers', name: 'Villagers', pic: 'emerald', about: 'Trading, curing' },
];

export const chapterById = (id) => CHAPTERS.find((c) => c.id === id) || null;
export const chapterNamed = (name) => CHAPTERS.find((c) => c.name === name) || null;
