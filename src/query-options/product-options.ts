import { infiniteQueryOptions, queryOptions, useMutation } from '@tanstack/react-query';
import type { Page } from '@/types/pageable';
import type { ApiResponseError } from '@/lib/api-error';
import type { ProductListFilters, ProductSummary } from '@/schemas/products';
import { CATALOGUE_PAGE_SIZE } from '@/schemas/products';
import { DEFAULT_STALE_TIME } from '@/config/query';
import {
  downloadCataloguePdf,
  getCatalogueFacets,
  getProduct,
  getProducts,
} from '@/api/products-api';

export const PRODUCT_KEY = 'products' as const;

/**
 * The catalogue grid. Infinite rather than one growing page: "Load more" appends the next fixed-size page
 * instead of re-requesting a larger one, so each click costs a single page of rows however deep the shopper
 * goes, and no one request can ask the server for an unbounded slice of the catalogue.
 */
export const productsOptions = (filters: ProductListFilters) => {
  return infiniteQueryOptions({
    queryKey: [PRODUCT_KEY, 'list', filters],
    queryFn: ({ pageParam }) =>
      getProducts(filters, { page: pageParam, size: CATALOGUE_PAGE_SIZE }),
    initialPageParam: 0,
    getNextPageParam: (lastPage: Page<ProductSummary>) =>
      lastPage.number + 1 < lastPage.totalPages
        ? lastPage.number + 1
        : undefined,
    staleTime: DEFAULT_STALE_TIME,
  });
};

/**
 * The filter rail's own description of the catalogue: which yarn colours are on sale and what price range they
 * span. Its own query rather than something derived from the current page of results - a facet list computed
 * from 24 visible products would rearrange itself on every "Load more" and on every filter change.
 */
export const catalogueFacetsOptions = () => {
  return queryOptions({
    queryKey: [PRODUCT_KEY, 'facets'],
    queryFn: () => getCatalogueFacets(),
    staleTime: DEFAULT_STALE_TIME,
  });
};

export const productOptions = (slug: string) => {
  return queryOptions({
    queryKey: [PRODUCT_KEY, 'detail', slug],
    queryFn: () => getProduct(slug),
    staleTime: DEFAULT_STALE_TIME,
  });
};

/**
 * A mutation rather than a plain `<a href>`: an anchor would send `Accept-Language` and stream natively, but
 * the render can take a few seconds for a large, unfiltered catalogue, and gives no pending state and no error
 * toast to show for it - see `catalogue-toolbar.tsx`, the only caller.
 */
export const useDownloadCataloguePdfMutation = () =>
  useMutation<
    { blob: Blob; fileName: string | null },
    ApiResponseError,
    ProductListFilters
  >({
    mutationFn: (filters) => downloadCataloguePdf(filters),
  });

export const FEATURED_PRODUCTS_COUNT = 3;

/**
 * The home dashboard's "Made for the little one" teaser and the shop landing page's grid - a plain page, not
 * the infinite list, since neither ever grows past its own fixed count. `count` is part of the query key so
 * the dashboard's 3 and the landing page's larger grid are separate cache entries rather than one clobbering
 * the other.
 *
 * <p>`featured: true` asks the backend for the maker's own picks (plans/PLAN-catalogue-admin.md decision 17);
 * the endpoint itself falls back to newest-first when nothing is flagged yet, so this teaser is never empty in
 * the window between that shipping and the maker choosing anything - nothing to branch on here.
 */
export const featuredProductsOptions = (
  count: number = FEATURED_PRODUCTS_COUNT,
) => {
  return queryOptions({
    queryKey: [PRODUCT_KEY, 'featured', count],
    queryFn: () => getProducts({ featured: true }, { page: 0, size: count }),
    staleTime: DEFAULT_STALE_TIME,
  });
};
