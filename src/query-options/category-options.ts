import { queryOptions } from '@tanstack/react-query';
import { DEFAULT_STALE_TIME } from '@/config/query';
import { getCategories } from '@/api/categories-api';

export const CATEGORY_KEY = 'categories' as const;

export const categoriesOptions = () => {
  return queryOptions({
    queryKey: [CATEGORY_KEY],
    queryFn: getCategories,
    staleTime: DEFAULT_STALE_TIME,
  });
};
