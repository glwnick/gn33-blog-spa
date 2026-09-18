import { queryOptions } from '@tanstack/react-query';
import { DEFAULT_STALE_TIME } from '@/config/query';
import { getAdminCategories } from '@/api/admin-categories-api';

export const ADMIN_CATEGORY_KEY = 'admin-categories' as const;

export const adminCategoriesOptions = () =>
  queryOptions({
    queryKey: [ADMIN_CATEGORY_KEY],
    queryFn: getAdminCategories,
    staleTime: DEFAULT_STALE_TIME,
  });
