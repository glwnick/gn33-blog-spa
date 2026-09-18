import {
  useQuery,
  useSuspenseInfiniteQuery,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { FilterRail } from '@/pages/shop/filter-rail';
import { CatalogueToolbar } from '@/pages/shop/catalogue-toolbar';
import { ProductCard } from '@/pages/shop/product-card';
import { AppContent } from '@/components/layout/app-content';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { CATALOGUE_PAGE_SIZE } from '@/schemas/products';
import {
  catalogueFacetsOptions,
  productsOptions,
} from '@/query-options/product-options';
import { categoriesOptions } from '@/query-options/category-options';
import { useFilters } from '@/hooks/use-filters';
import { useTranslation } from '@/hooks/use-translation';

export function CataloguePage() {
  const { t } = useTranslation();
  const { filters, setFilters, resetFilters } = useFilters('/shop/');

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useSuspenseInfiniteQuery(productsOptions(filters));

  const { data: categories = [] } = useQuery(categoriesOptions());
  // Suspense rather than a plain query with a fallback: the rail's price bounds and yarn swatches come from here,
  // and rendering it once against an empty catalogue and again against the real one would flash a section that
  // appears, then jumps to a different width. The route loader has already resolved this server-side.
  const { data: facets } = useSuspenseQuery(catalogueFacetsOptions());

  const products = data.pages.flatMap((page) => page.content);
  const totalElements = data.pages[0].totalElements;

  // The h1 follows the breadcrumb's leaf rather than staying "Shop" forever: filtering to a category is a
  // navigation in the shopper's head, and a page whose title never changes with it reads as if nothing did.
  const activeCategory = categories.find((c) => c.slug === filters.category);

  return (
    <AppContent
      title={
        <div className="flex flex-col gap-2">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link to="/" />}>{t('landingBreadcrumb')}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {activeCategory ? (
                  <BreadcrumbLink render={<Link to="/shop" />}>{t('shopTitle')}</BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{t('shopTitle')}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {activeCategory && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{activeCategory.name}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="truncate text-xl font-semibold tracking-tight">
            {activeCategory?.name ?? t('shopTitle')}
          </h1>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[236px_1fr]">
        <FilterRail
          categories={categories}
          facets={facets}
          filters={filters}
          setFilters={setFilters}
          resetFilters={resetFilters}
        />

        <div className="flex min-w-0 flex-col gap-4">
          <CatalogueToolbar
            resultCount={totalElements}
            categories={categories}
            facets={facets}
            filters={filters}
            setFilters={setFilters}
          />

          {products.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>{t('shopEmptyTitle')}</EmptyTitle>
                <EmptyDescription>{t('shopEmptyDescription')}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {hasNextPage && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                disabled={isFetchingNextPage}
                onClick={() => void fetchNextPage()}
              >
                {isFetchingNextPage
                  ? t('shopLoadingMore')
                  : t('shopLoadMore', { count: CATALOGUE_PAGE_SIZE })}
              </Button>
            </div>
          )}
        </div>
      </div>
    </AppContent>
  );
}

/**
 * Used as the route's `pendingComponent`, so it only ever renders during a client-side navigation whose loader
 * hasn't resolved yet - the initial load is server-rendered with the loader's data already dehydrated, so this
 * never appears there. Mirrors every row `CataloguePage` actually renders, not just the product grid: the
 * mobile category-pill row, the desktop filter card, and - the one this used to skip entirely - the toolbar's
 * search/sort row and result-count line, whose absence made the grid visibly jump down the moment real content
 * (with its own toolbar) replaced this skeleton.
 */
export function CataloguePageSkeleton() {
  return (
    <AppContent title={<Skeleton className="h-7 w-32" />}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[236px_1fr]">
        {/* Mirrors the real mobile row (filter-rail.tsx): a `-ml-3 pl-3 md:-ml-4 md:pl-4 overflow-x-auto` bleed
            on the scrollable pills only, plus a fixed Filter pill outside it - without it the row is narrower
            and non-scrolling here, then jumps to the viewport edge and gains a scrollbar the instant the real
            content mounts. No `scroll-fade-r` here - a static skeleton has nothing scrolled-off to hint at. */}
        <div className="flex items-center gap-2 lg:hidden">
          <div className="-ml-3 flex min-w-0 flex-1 gap-2 overflow-x-auto pl-3 pb-1 md:-ml-4 md:pl-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-8 w-20 shrink-0 rounded-full" />
            ))}
          </div>
          <Skeleton className="h-8 w-20 shrink-0 rounded-full" />
        </div>

        <Skeleton className="hidden h-[420px] rounded-xl lg:block" />

        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 min-w-0 flex-1 sm:max-w-xs" />
              <Skeleton className="ml-auto h-9 w-36 shrink-0 sm:w-44" />
            </div>
            <Skeleton className="h-4 w-24" />
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="aspect-4/5 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </AppContent>
  );
}
