import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import type { Page } from '@/types/pageable';
import type { ProductSummary } from '@/schemas/products';
import { FAVORITES_PAGE_SIZE } from '@/schemas/favorites';
import { DEFAULT_STALE_TIME } from '@/config/query';
import { getMyFavorites } from '@/api/favorites-api';

export const FAVORITE_KEY = 'favorites' as const;

/**
 * The account holder's wishlist. Infinite rather than one growing page, same reasoning as `productsOptions`:
 * "Load more" appends the next fixed-size page instead of re-requesting a larger one.
 */
export const myFavoritesOptions = () => {
  return infiniteQueryOptions({
    queryKey: [FAVORITE_KEY, 'list'],
    queryFn: ({ pageParam }) => getMyFavorites({ page: pageParam, size: FAVORITES_PAGE_SIZE }),
    initialPageParam: 0,
    getNextPageParam: (lastPage: Page<ProductSummary>) =>
      lastPage.number + 1 < lastPage.totalPages ? lastPage.number + 1 : undefined,
    staleTime: DEFAULT_STALE_TIME,
  });
};

/** The profile page's "Saved pieces" stat - a count only, same one-row-page trick as `activeOrderIdOptions`. */
export const myFavoritesCountOptions = () =>
  queryOptions({
    queryKey: [FAVORITE_KEY, 'count'],
    queryFn: async () => (await getMyFavorites({ page: 0, size: 1 })).totalElements,
    staleTime: DEFAULT_STALE_TIME,
  });
