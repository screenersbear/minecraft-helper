// The book's eight pages, in the order their tiles show. What's in each comes from the book (book.categories).
// pic: an item's picture for the tile. mob: a mob's picture instead.
export const CATEGORIES = [
  { id: 'tools', name: 'Tools', pic: 'iron_pickaxe' },
  { id: 'weapons', name: 'Weapons', pic: 'iron_sword' },
  { id: 'food', name: 'Food', pic: 'bread' },
  { id: 'building', name: 'Building', pic: 'bricks' },
  { id: 'redstone', name: 'Redstone', pic: 'redstone' },
  { id: 'mobs', name: 'Mobs', mob: 'creeper' },
  { id: 'farming', name: 'Farming', pic: 'wheat' },
  { id: 'magic', name: 'Magic', pic: 'enchanting_table' },
];

export const categoryById = (id) => CATEGORIES.find((c) => c.id === id) || null;
