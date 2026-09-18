import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import type { Page } from '@/types/pageable';
import type { OrderListFilter, OrderSummary } from '@/schemas/orders';
import { ORDERS_PAGE_SIZE } from '@/schemas/orders';
import { DEFAULT_STALE_TIME } from '@/config/query';
import { getMyOrders, getOrder } from '@/api/orders-api';

export const ORDER_KEY = 'orders' as const;

/**
 * The "my orders" list. Infinite rather than one growing page, same reasoning as `productsOptions`: "Load more"
 * appends the next fixed-size page instead of re-requesting a larger one.
 */
export const myOrdersOptions = (filter: OrderListFilter) => {
  return infiniteQueryOptions({
    queryKey: [ORDER_KEY, 'list', filter],
    queryFn: ({ pageParam }) =>
      getMyOrders(filter, { page: pageParam, size: ORDERS_PAGE_SIZE }),
    initialPageParam: 0,
    getNextPageParam: (lastPage: Page<OrderSummary>) =>
      lastPage.number + 1 < lastPage.totalPages ? lastPage.number + 1 : undefined,
    staleTime: DEFAULT_STALE_TIME,
  });
};

export const orderOptions = (orderId: string) =>
  queryOptions({
    queryKey: [ORDER_KEY, 'detail', orderId],
    queryFn: () => getOrder(orderId),
    staleTime: DEFAULT_STALE_TIME,
  });

/**
 * The id of the newest open order, or null - a plain existence check for the home dashboard's active-order
 * card, not a list. `OrderListFilter.OPEN` already excludes `DELIVERED` and every terminal status, so the
 * newest match is unambiguously "the" active order.
 */
export const activeOrderIdOptions = () =>
  queryOptions({
    queryKey: [ORDER_KEY, 'active'],
    queryFn: async () => (await getMyOrders('OPEN', { page: 0, size: 1 })).content[0]?.id ?? null,
    staleTime: DEFAULT_STALE_TIME,
  });

/** The profile page's "Orders" stat - a count only, same one-row-page trick as `activeOrderIdOptions`. */
export const myOrderCountOptions = () =>
  queryOptions({
    queryKey: [ORDER_KEY, 'count'],
    queryFn: async () => (await getMyOrders('ALL', { page: 0, size: 1 })).totalElements,
    staleTime: DEFAULT_STALE_TIME,
  });
