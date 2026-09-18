import { queryOptions } from '@tanstack/react-query';
import { DEFAULT_STALE_TIME } from '@/config/query';
import { getAdminSizes, getProductsUsingSize } from '@/api/sizes-api';

export const SIZE_KEY = 'sizes' as const;

/** The whole list. Small and slow-changing, so it is one unpaginated list, like yarns and categories. */
export const adminSizesOptions = () => {
  return queryOptions({
    queryKey: [SIZE_KEY, 'admin'],
    queryFn: getAdminSizes,
    staleTime: DEFAULT_STALE_TIME,
  });
};

/**
 * Only fetched when the delete dialog opens for a size that is in use - the list itself already carries the
 * count, and the names are just what that count is made of.
 */
export const sizeProductsOptions = (sizeId: string, enabled: boolean) => {
  return queryOptions({
    queryKey: [SIZE_KEY, 'products', sizeId],
    queryFn: () => getProductsUsingSize(sizeId),
    staleTime: DEFAULT_STALE_TIME,
    enabled,
  });
};
