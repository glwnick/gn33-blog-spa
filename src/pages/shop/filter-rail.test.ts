import { describe, expect, it } from 'vitest';
import { priceSliderBounds } from './filter-rail';
import type { CatalogueFacets } from '@/schemas/products';

const facets = (
  minPrice: number | null,
  maxPrice: number | null,
): CatalogueFacets => ({ colours: [], sizes: [], materials: [], minPrice, maxPrice });

describe('priceSliderBounds', () => {
  it('widens the catalogue range outward to the step so both ends are reachable', () => {
    // The seed catalogue: cheapest variant 19 RON, dearest 219. Landing the max on 219 would leave a shopper
    // who dragged it down unable to get back to "no upper limit", since 219 is not on a step boundary.
    expect(priceSliderBounds(facets(19, 219))).toEqual({ min: 15, max: 220 });
  });

  it('leaves a range that already sits on step boundaries alone', () => {
    expect(priceSliderBounds(facets(50, 150))).toEqual({ min: 50, max: 150 });
  });

  it('returns null for an empty catalogue rather than a 0-0 slider', () => {
    expect(priceSliderBounds(facets(null, null))).toBeNull();
  });

  it('returns null when every piece costs the same - the two ends would mean one thing', () => {
    expect(priceSliderBounds(facets(100, 100))).toBeNull();
  });

  it('still gives a usable range for prices that only differ within a step', () => {
    // Rounding outward is what saves these: 101 floors to 100 and 104 ceils to 105, so there is a step to drag
    // even though the catalogue spans less than one. Only a range collapsing onto a single boundary is null,
    // which matters because Base UI's Slider rejects `min === max` outright.
    expect(priceSliderBounds(facets(101, 104))).toEqual({ min: 100, max: 105 });
    expect(priceSliderBounds(facets(100, 100.5))).toEqual({ min: 100, max: 105 });
  });
});
