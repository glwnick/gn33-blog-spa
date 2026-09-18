import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import type {
  CatalogueFacets,
  Category,
  ProductListFilters,
} from '@/schemas/products';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useTranslation } from '@/hooks/use-translation';
import { formatPrice } from '@/lib/formatting';
import { cn } from '@/lib/utils';

/** Slider granularity in RON. Coarse on purpose: a shopper brackets a budget, they do not dial in a price. */
const PRICE_STEP = 5;

/**
 * The slider's bounds, widened outward from the catalogue's real cheapest and dearest variant to the nearest
 * `PRICE_STEP` so that both ends are actually reachable by a step - land the max on 219 and the shopper can
 * never drag back to "no upper limit".
 *
 * <p>Exported because the toolbar renders the same range back as a removable chip, and the two have to agree on
 * what "no price filter" looks like: a handle parked on a bound means that side is unset, not that it is set to
 * the bound.
 *
 * <p>Null means there is nothing to choose between - an empty catalogue, or every piece within one step of the
 * same price. Base UI's Slider requires `min` and `max` to differ, and a slider whose two ends mean the same
 * thing is noise rather than a filter, so the caller drops the whole section instead.
 */
export function priceSliderBounds(
  facets: CatalogueFacets,
): { min: number; max: number } | null {
  if (facets.minPrice === null || facets.maxPrice === null) return null;
  const min = Math.floor(facets.minPrice / PRICE_STEP) * PRICE_STEP;
  const max = Math.ceil(facets.maxPrice / PRICE_STEP) * PRICE_STEP;
  return max > min ? { min, max } : null;
}

type FilterRailProps = {
  categories: ReadonlyArray<Category>;
  facets: CatalogueFacets;
  filters: ProductListFilters;
  setFilters: (partial: Partial<ProductListFilters>) => void;
  resetFilters: () => void;
};

function FilterRailContent({
  categories,
  facets,
  filters,
  setFilters,
  resetFilters,
  showHeading = true,
}: FilterRailProps & { showHeading?: boolean }) {
  const { t } = useTranslation();
  const selectedColours = filters.colours ? filters.colours.split(',') : [];
  const selectedSizes = filters.sizes ? filters.sizes.split(',') : [];
  const selectedMaterials = filters.materials ? filters.materials.split(',') : [];
  const priceBounds = priceSliderBounds(facets);

  const toggleColour = (name: string) => {
    const next = selectedColours.includes(name)
      ? selectedColours.filter((c) => c !== name)
      : [...selectedColours, name];
    setFilters({ colours: next.length > 0 ? next.join(',') : undefined });
  };

  const toggleSize = (name: string) => {
    const next = selectedSizes.includes(name)
      ? selectedSizes.filter((s) => s !== name)
      : [...selectedSizes, name];
    setFilters({ sizes: next.length > 0 ? next.join(',') : undefined });
  };

  const toggleMaterial = (name: string) => {
    const next = selectedMaterials.includes(name)
      ? selectedMaterials.filter((m) => m !== name)
      : [...selectedMaterials, name];
    setFilters({ materials: next.length > 0 ? next.join(',') : undefined });
  };

  const hasActiveFilters =
    filters.category !== undefined ||
    filters.minPrice !== undefined ||
    filters.maxPrice !== undefined ||
    filters.colours !== undefined ||
    filters.sizes !== undefined ||
    filters.materials !== undefined ||
    filters.readyToShip !== undefined ||
    filters.search !== undefined;

  return (
    <div className="flex flex-col gap-5 p-4">
      {/* The Sheet supplies its own visible "Filters" title, so repeating it here would print the word twice.
          The row stays either way because it also carries "Clear", which then sits alone against the right. */}
      <div
        className={cn(
          'flex items-center',
          showHeading ? 'justify-between' : 'justify-end',
        )}
      >
        {showHeading && <p className="text-sm font-semibold">{t('shopFilters')}</p>}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="text-xs font-medium text-muted-foreground hover:text-foreground hover:underline"
          >
            {t('shopClearFilters')}
          </button>
        )}
      </div>

      {/*
        Radios, not checkboxes: the backend takes a single `category` slug, so picking one clears the other.
        A checkbox promises "tick as many as you like" and then silently unticks the previous choice.
        `All` is a real option rather than an implicit "untick to clear", because a radio group has no
        gesture for deselecting the item you are already on.
      */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-muted-foreground uppercase">{t('shopCategory')}</p>
        <RadioGroup
          value={filters.category ?? ''}
          onValueChange={(value) =>
            setFilters({ category: value === '' ? undefined : String(value) })
          }
          className="gap-2"
        >
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <RadioGroupItem value="" />
            <span className="flex-1">{t('shopCategoryAll')}</span>
          </label>
          {categories.map((category) => (
            <label key={category.id} className="flex cursor-pointer items-center gap-2 text-sm">
              <RadioGroupItem value={category.slug} />
              <span className="flex-1">{category.name}</span>
              <span className="text-xs text-muted-foreground">{category.productCount}</span>
            </label>
          ))}
        </RadioGroup>
      </div>

      {priceBounds && (
        <div className="flex flex-col gap-2 border-t pt-4">
          <p className="text-xs font-medium text-muted-foreground uppercase">{t('shopPrice')}</p>
          <Slider
            min={priceBounds.min}
            max={priceBounds.max}
            step={PRICE_STEP}
            value={[
              filters.minPrice ?? priceBounds.min,
              filters.maxPrice ?? priceBounds.max,
            ]}
            onValueChange={(value) => {
              const [min, max] = value as Array<number>;
              // A handle resting on its bound clears that side rather than sending the bound itself: the URL then
              // describes only what the shopper actually narrowed, which is what gets shared and indexed.
              setFilters({
                minPrice: min === priceBounds.min ? undefined : min,
                maxPrice: max === priceBounds.max ? undefined : max,
              });
            }}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatPrice(filters.minPrice ?? priceBounds.min)}</span>
            <span>{formatPrice(filters.maxPrice ?? priceBounds.max)}</span>
          </div>
        </div>
      )}

      {facets.colours.length > 0 && (
        <div className="flex flex-col gap-2 border-t pt-4">
          <p className="text-xs font-medium text-muted-foreground uppercase">{t('shopYarn')}</p>
          <div className="flex flex-wrap gap-1.5">
            {facets.colours.map((colour) => (
              <button
                key={colour.name}
                type="button"
                aria-pressed={selectedColours.includes(colour.name)}
                // The count goes in the tooltip rather than inline as the category rows show it: these are pills in
                // a 236px rail, and a second number inside each one wraps the list onto twice as many lines.
                title={t('shopYarnProductCount', { count: colour.productCount })}
                onClick={() => toggleColour(colour.name)}
                className={cn(
                  'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                  selectedColours.includes(colour.name)
                    ? 'border-primary bg-accent text-accent-foreground'
                    : 'border-border text-muted-foreground hover:text-foreground',
                )}
              >
                {/* `colourHex` is nullable on the variant, so a maker can name a yarn without picking a swatch.
                    The dot then falls back to the muted token rather than rendering as a transparent hole. */}
                <span
                  className={cn(
                    'size-2.5 rounded-full ring-1 ring-foreground/15',
                    !colour.hex && 'bg-muted',
                  )}
                  style={colour.hex ? { backgroundColor: colour.hex } : undefined}
                />
                {colour.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {facets.sizes.length > 0 && (
        <div className="flex flex-col gap-2 border-t pt-4">
          <p className="text-xs font-medium text-muted-foreground uppercase">{t('shopSize')}</p>
          <div className="flex flex-wrap gap-1.5">
            {facets.sizes.map((size) => (
              <button
                key={size.name}
                type="button"
                aria-pressed={selectedSizes.includes(size.name)}
                title={t('shopSizeProductCount', { count: size.productCount })}
                onClick={() => toggleSize(size.name)}
                className={cn(
                  'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                  selectedSizes.includes(size.name)
                    ? 'border-primary bg-accent text-accent-foreground'
                    : 'border-border text-muted-foreground hover:text-foreground',
                )}
              >
                {size.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {facets.materials.length > 0 && (
        <div className="flex flex-col gap-2 border-t pt-4">
          <p className="text-xs font-medium text-muted-foreground uppercase">{t('shopMaterial')}</p>
          <div className="flex flex-wrap gap-1.5">
            {facets.materials.map((material) => (
              <button
                key={material.name}
                type="button"
                aria-pressed={selectedMaterials.includes(material.name)}
                title={t('shopMaterialProductCount', { count: material.productCount })}
                onClick={() => toggleMaterial(material.name)}
                className={cn(
                  'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                  selectedMaterials.includes(material.name)
                    ? 'border-primary bg-accent text-accent-foreground'
                    : 'border-border text-muted-foreground hover:text-foreground',
                )}
              >
                {material.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <label className="flex cursor-pointer items-center justify-between border-t pt-4 text-sm">
        <span>{t('shopReadyToShipOnly')}</span>
        <Switch
          checked={filters.readyToShip ?? false}
          onCheckedChange={(checked) => setFilters({ readyToShip: checked ? true : undefined })}
        />
      </label>
    </div>
  );
}

/** Sticky card on desktop; a bottom Sheet opened by a "Filter" pill below `lg` - see the handoff's mobile spec. */
export function FilterRail(props: FilterRailProps) {
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { categories, filters, setFilters } = props;

  return (
    <>
      <Card className="sticky top-20 hidden p-0 lg:block">
        <CardHeader className="sr-only">{t('shopFilters')}</CardHeader>
        <CardContent className="p-0">
          <FilterRailContent {...props} />
        </CardContent>
      </Card>

      {/*
        The handoff's mobile row: category pills that scroll horizontally, plus a Filter pill that opens the
        sheet. The pills duplicate the sheet's own category radios on purpose - category is the filter a shopper
        reaches for constantly, and making it cost a drawer open, a scroll and a close is exactly what the handoff
        puts this row out here to avoid.

        The Filter pill deliberately sits *outside* the scrolling strip rather than as its last item: with enough
        categories to fill a phone width, "last item in a horizontally-scrolling row" is indistinguishable from
        "off the edge, nothing more here" - a shopper has no cue there is a further pill to scroll to, let alone
        that it opens the whole filter set. Anchoring it as a fixed sibling keeps it on-screen and tappable no
        matter how far the pills scroll, or how many categories the maker adds. The strip itself carries the same
        risk one level down - the same "off the edge" blindness applies to whichever category pill happens to be
        last - so `scroll-fade-r` (styles.css) fades its trailing edge toward the page background as a static,
        JS-free hint that more sits off-screen, mirroring the plain leading edge left by the deliberate bleed below.
      */}
      <div className="flex items-center gap-2 lg:hidden">
        {/* `-ml-3 pl-3` bleeds only the left edge through `AppContent`'s own padding to the viewport edge, which is
            what makes the strip read as scrollable rather than as a clipped row; the right edge stays inside the
            page's normal padding since the Filter pill now follows it in-flow rather than bleeding with it.
            `md:-ml-4 md:pl-4` mirrors `AppContent`'s own `px-3 md:px-4` step exactly, so the bleed still lands
            flush at the viewport edge once that padding grows at 768px - this row stays visible until `lg`
            (1024px), so it lives through that step. */}
        <div className="scroll-fade-r -ml-3 flex min-w-0 flex-1 gap-2 overflow-x-auto pl-3 pb-1 md:-ml-4 md:pl-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <CategoryPill
            label={t('shopCategoryAll')}
            selected={filters.category === undefined}
            onClick={() => setFilters({ category: undefined })}
          />
          {categories.map((category) => (
            <CategoryPill
              key={category.id}
              label={category.name}
              selected={filters.category === category.slug}
              onClick={() => setFilters({ category: category.slug })}
            />
          ))}
        </div>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            render={<Button variant="outline" size="sm" className="h-8 shrink-0 rounded-full" />}
          >
            <SlidersHorizontal className="size-4" />
            {t('shopFilters')}
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85svh] gap-0">
            <SheetHeader className="border-b">
              <SheetTitle>{t('shopFilters')}</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto">
              <FilterRailContent {...props} showHeading={false} />
            </div>
            {/* Filters already apply live as each control is touched - this button's job is not to submit anything,
                it is to give the drawer an unambiguous "I'm done" gesture and close it, rather than leaving a
                shopper to guess that tapping the backdrop or dragging down is how they get back to their results. */}
            <SheetFooter className="border-t">
              <SheetClose render={<Button className="w-full" />}>
                {t('shopApplyFilters')}
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

function CategoryPill({
  label,
  selected,
  onClick,
}: {
  readonly label: string;
  readonly selected: boolean;
  readonly onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        'h-8 shrink-0 rounded-full border px-3 text-xs font-medium whitespace-nowrap transition-colors',
        selected
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border text-muted-foreground',
      )}
    >
      {label}
    </button>
  );
}
