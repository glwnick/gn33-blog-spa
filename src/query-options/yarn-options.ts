import { queryOptions } from '@tanstack/react-query';
import { DEFAULT_STALE_TIME } from '@/config/query';
import { getAdminYarns, getProductsUsingYarn } from '@/api/yarns-api';

export const YARN_KEY = 'yarns' as const;

/** The whole palette. Small and slow-changing, so it is one unpaginated list, like categories. */
export const adminYarnsOptions = () => {
  return queryOptions({
    queryKey: [YARN_KEY, 'admin'],
    queryFn: getAdminYarns,
    staleTime: DEFAULT_STALE_TIME,
  });
};

/**
 * Only fetched when the delete dialog opens for a yarn that is in use - the list itself already carries the
 * count, and the names are just what that count is made of.
 */
export const yarnProductsOptions = (yarnId: string, enabled: boolean) => {
  return queryOptions({
    queryKey: [YARN_KEY, 'products', yarnId],
    queryFn: () => getProductsUsingYarn(yarnId),
    staleTime: DEFAULT_STALE_TIME,
    enabled,
  });
};
