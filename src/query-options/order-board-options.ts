import { queryOptions } from '@tanstack/react-query';
import { DEFAULT_STALE_TIME } from '@/config/query';
import { getOrderBoard } from '@/api/orders-api';
import { ORDER_KEY } from '@/query-options/order-options';

/** Slice 7's order-management board. Not paginated - a "board" of every non-terminal order at this shop's scale. */
export const orderBoardOptions = () =>
  queryOptions({
    queryKey: [ORDER_KEY, 'board'],
    queryFn: () => getOrderBoard(),
    staleTime: DEFAULT_STALE_TIME,
  });
