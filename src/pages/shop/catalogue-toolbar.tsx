import { FileDown, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import type {
  CatalogueFacets,
  Category,
  ProductListFilters,
  ProductSort,
} from '@/schemas/products';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DebouncedInput } from '@/components/debounce-input';
import { priceSliderBounds } from '@/pages/shop/filter-rail';
import { useTranslation } from '@/hooks/use-translation';
import { formatPrice } from '@/lib/formatting';
import { saveBlobAsFile } from '@/lib/save-blob-as-file';
import { useDownloadCataloguePdfMutation } from '@/query-options/product-options';
import { useAuth } from '@/context/auth-provider';

type Chip = { key: string; label: string; onRemove: () => void };

type CatalogueToolbarProps = {
  resultCount: number;
  categories: ReadonlyArray<Category>;
  facets: CatalogueFacets;
  filters: ProductListFilters;
  setFilters: (partial: Partial<ProductListFilters>) => void;
};

export function CatalogueToolbar({
  resultCount,
  categories,
  facets,
  filters,
  setFilters,
}: CatalogueToolbarProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.roles.includes('ROLE_ADMIN');
  const priceBounds = priceSliderBounds(facets);
  const { mutate: downloadPdf, isPending: isDownloadingPdf } =
    useDownloadCataloguePdfMutation();

  const handleDownloadPdf = () => {
    downloadPdf(filters, {
      onSuccess: ({ blob, fileName }) => {
        // The server's own branded, dated name wins; the fallback only covers a header the browser refuses
        // to hand over, and deliberately does not try to reproduce the brand it cannot know.
        const today = new Date().toISOString().slice(0, 10);
        saveBlobAsFile(blob, fileName ?? `catalogue-${today}.pdf`);
      },
      onError: () => {
        toast.error(t('shopDownloadPdfError'));
      },
    });
  };

  // DEFAULT first: it is what an untouched shop visit already shows (the backend's own no-sort default groups
  // by category - see ProductSortOption.DEFAULT), so it belongs at the top as the implicit starting point, not
  // buried after the three sorts a shopper has to deliberately choose.
  const sortItems: Array<{ value: ProductSort; label: string }> = [
    { value: 'DEFAULT', label: t('shopSortDefault') },
    { value: 'NEWEST', label: t('shopSortNewest') },
    { value: 'PRICE_ASC', label: t('shopSortPriceAsc') },
    { value: 'PRICE_DESC', label: t('shopSortPriceDesc') },
  ];

  const chips: Array<Chip> = [];
  if (filters.category) {
    const category = categories.find((c) => c.slug === filters.category);
    chips.push({
      key: 'category',
      label: category?.name ?? filters.category,
      onRemove: () => setFilters({ category: undefined }),
    });
  }
  if (filters.search) {
    chips.push({
      key: 'search',
      label: `“${filters.search}”`,
      onRemove: () => setFilters({ search: undefined }),
    });
  }
  // `priceBounds` can be null while a price filter is still in the URL - a shopper shares a link, the last item in
  // that bracket sells out, and the catalogue no longer spans a range. Fall back to the filter's own values so the
  // chip still reads as a range and can still be removed, rather than vanishing and stranding the filter.
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const from = filters.minPrice ?? priceBounds?.min;
    const to = filters.maxPrice ?? priceBounds?.max;
    chips.push({
      key: 'price',
      label: [from, to]
        .map((value) => (value === undefined ? '…' : formatPrice(value)))
        .join(' - '),
      onRemove: () => setFilters({ minPrice: undefined, maxPrice: undefined }),
    });
  }
  filters.colours?.split(',').forEach((colour) => {
    chips.push({
      key: `colour-${colour}`,
      label: colour,
      onRemove: () => {
        const remaining = filters.colours!.split(',').filter((c) => c !== colour);
        setFilters({ colours: remaining.length > 0 ? remaining.join(',') : undefined });
      },
    });
  });
  filters.sizes?.split(',').forEach((size) => {
    chips.push({
      key: `size-${size}`,
      label: size,
      onRemove: () => {
        const remaining = filters.sizes!.split(',').filter((s) => s !== size);
        setFilters({ sizes: remaining.length > 0 ? remaining.join(',') : undefined });
      },
    });
  });
  filters.materials?.split(',').forEach((material) => {
    chips.push({
      key: `material-${material}`,
      label: material,
      onRemove: () => {
        const remaining = filters.materials!.split(',').filter((m) => m !== material);
        setFilters({ materials: remaining.length > 0 ? remaining.join(',') : undefined });
      },
    });
  });
  if (filters.readyToShip) {
    chips.push({
      key: 'readyToShip',
      label: t('shopReadyToShipOnly'),
      onRemove: () => setFilters({ readyToShip: undefined }),
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Controls on the first row, the state they produce on the second. Both live here rather than in the rail
          because the rail is a Sheet below `lg`, and a search field a shopper has to open a drawer to reach is a
          search field they will not find. */}
      <div className="flex items-center gap-3">
        {/* `flex-1 sm:max-w-xs` needs a flex-item wrapper - `DebouncedInput`'s own `className` sizes the bordered
            group directly, but growing/shrinking within this row is a layout concern for the item, not the group.
            `min-w-0` so it can actually give way at 375px instead of forcing the row wider than the viewport. */}
        <div className="min-w-0 flex-1 sm:max-w-xs">
          <DebouncedInput
            type="search"
            debounce={400}
            value={filters.search ?? ''}
            onChange={(value) =>
              setFilters({ search: String(value).trim() || undefined })
            }
            placeholder={t('shopSearchPlaceholder')}
            aria-label={t('shopSearchPlaceholder')}
            startNode={<Search className="size-4" />}
          />
        </div>

        {/* Icon-only below `sm`, same squeeze the sort trigger already accounts for at 375px - and matches
            exactly what the current filters, search and sort produce, never the whole catalogue.
            Admin-only: the PDF export is a back-office tool, not a shopper-facing feature. */}
        {isAdmin && (
          <>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 sm:hidden"
              disabled={resultCount === 0 || isDownloadingPdf}
              onClick={handleDownloadPdf}
              aria-label={t('shopDownloadPdf')}
            >
              <FileDown className="size-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden shrink-0 sm:inline-flex"
              disabled={resultCount === 0 || isDownloadingPdf}
              onClick={handleDownloadPdf}
            >
              <FileDown className="size-4" />
              {t('shopDownloadPdf')}
            </Button>
          </>
        )}

        <div className="ml-auto shrink-0">
          <Select
            items={sortItems}
            // DEFAULT, not NEWEST: an untouched visit really is grouped by category (see sortItems above), so
            // the trigger should say so rather than claiming an order the listing isn't actually using.
            value={filters.sort ?? 'DEFAULT'}
            onValueChange={(value) => setFilters({ sort: value as ProductSort })}
          >
            {/* Narrower below `sm`: at 375px the full 176px leaves the search field too little room to show its
                own placeholder, and the sort labels ("Newest", "Price ↑") are short enough to survive the trim. */}
            <SelectTrigger className="w-36 sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm text-muted-foreground">
          {t('shopResultCount', { count: resultCount })}
        </p>

        {chips.map((chip) => (
          <button
            key={chip.key}
            type="button"
            onClick={chip.onRemove}
            className="flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground"
          >
            {chip.label}
            <X className="size-3" />
          </button>
        ))}
      </div>
    </div>
  );
}
