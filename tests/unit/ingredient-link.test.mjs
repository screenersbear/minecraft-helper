// The ingredient link when an answer's address already has a question in it: from goes after "&". No answer type
// gives such an address today, so routes is stood in for here.
import './_setup.mjs';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../logic/routes.js', async (real) => ({ ...(await real()), hashForAnswer: () => '#/recipe/sugar?k=make' }));
const { ingredientHash } = await import('../../logic/ingredient-link.js');

const ctx = { book: { items: { sugar: { name: 'Sugar' } }, recipes: { sugar: [{ how: 'crafting' }] }, facts: {}, mobs: {} }, guides: [], list: [] };

describe('ingredientHash with a query already in the address', () => {
  it('adds from with &', () => expect(ingredientHash('sugar', ctx, 'recipe/cake')).toBe('#/recipe/sugar?k=make&from=recipe%2Fcake'));
  it('no from leaves it as it is', () => expect(ingredientHash('sugar', ctx)).toBe('#/recipe/sugar?k=make'));
  it('from is encoded', () => expect(ingredientHash('sugar', ctx, 'book/food')).toBe('#/recipe/sugar?k=make&from=book%2Ffood'));
});
