import { describe, expect, it } from 'vitest';
import { pickDefaultVariant } from './product-card';
import type { ProductVariant } from '@/schemas/products';

const variant = (overrides: Partial<ProductVariant> & { id: string }): ProductVariant => ({
  sku: `SKU-${overrides.id}`,
  size: null,
  colourName: null,
  colourHex: null,
  fibreComposition: null,
  material: null,
  price: 100,
  available: true,
  oneOfAKind: false,
  madeToOrder: false,
  leadTimeDays: null,
  ...overrides,
});

describe('pickDefaultVariant', () => {
  it('picks the first available variant over an earlier unavailable one', () => {
    const variants = [
      variant({ id: 'a', available: false }),
      variant({ id: 'b', available: true }),
      variant({ id: 'c', available: true }),
    ];
    expect(pickDefaultVariant(variants)?.id).toBe('b');
  });

  it('falls back to the first variant when every variant is sold out', () => {
    const variants = [
      variant({ id: 'a', available: false }),
      variant({ id: 'b', available: false }),
    ];
    // The caller (`ProductCard`'s quick-add) is what turns this into a "sold out" toast rather than a
    // silent add - the fallback itself just has to return a real variant to check, not a null.
    const picked = pickDefaultVariant(variants);
    expect(picked?.id).toBe('a');
    expect(picked?.available).toBe(false);
  });

  it('returns undefined for a product with no variants at all', () => {
    expect(pickDefaultVariant([])).toBeUndefined();
  });
});
