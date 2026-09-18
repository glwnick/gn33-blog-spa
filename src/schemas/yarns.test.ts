import { describe, expect, it } from 'vitest';
import { adminYarnInputSchema, adminYarnSchema } from './yarns';

const base = {
  name: 'Oat',
  fibreComposition: '100% cotton',
  supplier: null,
  notes: null,
  discontinued: false,
};

describe('adminYarnInputSchema', () => {
  it('accepts a six-digit hex in either case', () => {
    expect(adminYarnInputSchema.parse({ ...base, hex: '#E8D9C5' }).hex).toBe('#E8D9C5');
    expect(adminYarnInputSchema.parse({ ...base, hex: '#e8d9c5' }).hex).toBe('#e8d9c5');
  });

  it('accepts a cleared swatch, since a form yields an empty string rather than null', () => {
    expect(adminYarnInputSchema.safeParse({ ...base, hex: '' }).success).toBe(true);
    expect(adminYarnInputSchema.safeParse({ ...base, hex: null }).success).toBe(true);
  });

  it('rejects anything that is not a hex literal - it is written into inline CSS', () => {
    // A named CSS colour would actually render, which is the trap: it would work in the browser and then be
    // rejected by the backend's own stricter pattern on save.
    expect(adminYarnInputSchema.safeParse({ ...base, hex: 'rebeccapurple' }).success).toBe(false);
    expect(adminYarnInputSchema.safeParse({ ...base, hex: '#E8D9C' }).success).toBe(false);
    expect(adminYarnInputSchema.safeParse({ ...base, hex: 'E8D9C5' }).success).toBe(false);
  });

  it('requires a name', () => {
    expect(adminYarnInputSchema.safeParse({ ...base, name: '', hex: null }).success).toBe(false);
  });
});

describe('adminYarnSchema', () => {
  it('parses a yarn with no swatch, supplier or notes - all three are optional for the maker', () => {
    const parsed = adminYarnSchema.parse({
      id: '9c1b1e40-6c1a-4e8a-8f4a-1c2d3e4f5a6b',
      name: 'Undyed',
      hex: null,
      fibreComposition: null,
      supplier: null,
      notes: null,
      displayOrder: 0,
      discontinued: false,
      productCount: 0,
    });
    expect(parsed).toMatchObject({ name: 'Undyed', hex: null, productCount: 0 });
  });
});
