import { queryOptions } from '@tanstack/react-query';
import { DEFAULT_STALE_TIME } from '@/config/query';
import { getOrderConfirmation, getStorefrontConfig } from '@/api/checkout-api';

export const orderConfirmationOptions = (orderId: string) =>
  queryOptions({
    queryKey: ['orders', 'confirmation', orderId],
    queryFn: () => getOrderConfirmation(orderId),
    staleTime: DEFAULT_STALE_TIME,
  });

export const storefrontConfigOptions = () =>
  queryOptions({
    queryKey: ['orders', 'storefront-config'],
    queryFn: getStorefrontConfig,
    staleTime: DEFAULT_STALE_TIME,
  });
