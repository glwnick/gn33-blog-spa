import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ColourSwatchButton, defaultIndexFor, resolveVariant, wrapIndex } from './product-detail-page';
import type { ProductImage, ProductVariant } from '@/schemas/products';

const image = (overrides: Partial<ProductImage> & { url: string }): ProductImage => ({
  altText: '',
  primary: false,
  variantId: null,
  ...overrides,
});

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

describe('defaultIndexFor', () => {
  it('picks the image flagged primary over an earlier one that is not', () => {
    const images = [image({ url: 'a' }), image({ url: 'b', primary: true }), image({ url: 'c' })];
    expect(defaultIndexFor(images)).toBe(1);
  });

  it('falls back to the first image when none is flagged primary', () => {
    const images = [image({ url: 'a' }), image({ url: 'b' })];
    expect(defaultIndexFor(images)).toBe(0);
  });

  it('returns 0 for an empty gallery rather than -1', () => {
    expect(defaultIndexFor([])).toBe(0);
  });
});

describe('wrapIndex', () => {
  it('leaves an in-range index untouched', () => {
    expect(wrapIndex(1, 3)).toBe(1);
  });

  it('wraps a negative index to the end, not to a negative scrollLeft', () => {
    // JS's `%` keeps the sign of the dividend, so a naive `-1 % 3` is `-1` - this is the case that catches it.
    expect(wrapIndex(-1, 3)).toBe(2);
  });

  it('wraps an index past the end back to the start', () => {
    expect(wrapIndex(3, 3)).toBe(0);
  });

  it('returns 0 for a zero-length gallery rather than dividing by zero', () => {
    expect(wrapIndex(2, 0)).toBe(0);
  });
});

describe('resolveVariant', () => {
  it('prefers a candidate that keeps the other axis and is available', () => {
    const candidates = [
      variant({ id: 'a', size: 'S', available: true }),
      variant({ id: 'b', size: 'M', available: true }),
    ];
    const picked = resolveVariant(candidates, (v) => v.size === 'M');
    expect(picked?.id).toBe('b');
  });

  it('falls back to any available candidate when none keeps the other axis', () => {
    const candidates = [
      variant({ id: 'a', size: 'S', available: true }),
      variant({ id: 'b', size: 'M', available: false }),
    ];
    // Asking to keep size 'L', which nothing has - the size-S candidate should still win over the
    // size-matching-but-sold-out one, exactly like `selectBy`'s own fallback order.
    const picked = resolveVariant(candidates, (v) => v.size === 'L');
    expect(picked?.id).toBe('a');
  });

  it('falls back to the first candidate when every one is unavailable', () => {
    const candidates = [
      variant({ id: 'a', available: false }),
      variant({ id: 'b', available: false }),
    ];
    expect(resolveVariant(candidates, () => true)?.id).toBe('a');
  });

  it('returns undefined for an empty candidate list', () => {
    expect(resolveVariant([], () => true)).toBeUndefined();
  });
});

describe('ColourSwatchButton', () => {
  it('renders a plain hex disc, never the variant photo', () => {
    render(<ColourSwatchButton name="Oat" hex="#E8D9C5" selected={false} available onSelect={() => {}} />);
    const button = screen.getByRole('button', { name: 'Oat' });
    expect(button.style.backgroundColor).toBe('rgb(232, 217, 197)');
    expect(button.querySelector('img')).toBeNull();
  });

  it('falls back to the muted token when the yarn has no hex, rather than a transparent disc', () => {
    render(<ColourSwatchButton name="Handspun mix" hex={null} selected={false} available onSelect={() => {}} />);
    const button = screen.getByRole('button', { name: 'Handspun mix' });
    expect(button.style.backgroundColor).toBe('');
    expect(button.className).toContain('bg-muted');
  });
});
