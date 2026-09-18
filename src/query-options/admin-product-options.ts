import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import type { AdminProductListFilters } from '@/schemas/admin-products';
import { DEFAULT_STALE_TIME } from '@/config/query';
import {
  getAdminProduct,
  getAdminProductDefaults,
  getAdminProducts,
} from '@/api/admin-products-api';

export const ADMIN_PRODUCT_KEY = 'admin-products' as const;

export const adminProductsOptions = (filters: AdminProductListFilters) => {
  return queryOptions({
    queryKey: [ADMIN_PRODUCT_KEY, filters],
    queryFn: () => getAdminProducts(filters),
    placeholderData: keepPreviousData,
    staleTime: DEFAULT_STALE_TIME,
  });
};

export const adminProductOptions = (productId: string) => {
  return queryOptions({
    queryKey: [ADMIN_PRODUCT_KEY, productId],
    queryFn: () => getAdminProduct(productId),
    staleTime: DEFAULT_STALE_TIME,
  });
};

export const adminProductDefaultsOptions = () => {
  return queryOptions({
    queryKey: [ADMIN_PRODUCT_KEY, 'defaults'],
    queryFn: () => getAdminProductDefaults(),
    staleTime: DEFAULT_STALE_TIME,
  });
};
