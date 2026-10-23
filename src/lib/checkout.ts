import { z } from 'zod';

export const cartSchema = z.object({
  items: z.array(z.object({
    id: z.string().regex(/^[a-f\d]{24}$/i),
    quantity: z.number().int().min(1).max(99),
  })).min(1).max(50),
});

// Merge repeated IDs so multiple lines cannot bypass quantity and stock limits.
export function normalizeCart(input: unknown) {
  const { items } = cartSchema.parse(input);
  const quantities = new Map<string, number>();
  for (const item of items) {
    const id = item.id.toLowerCase();
    const quantity = (quantities.get(id) ?? 0) + item.quantity;
    if (quantity > 99) throw new Error('A maximum of 99 units per product is allowed.');
    quantities.set(id, quantity);
  }
  return Array.from(quantities).map(([id, quantity]) => ({ id, quantity }));
}
