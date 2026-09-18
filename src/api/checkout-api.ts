import type { CheckoutRequest, StorefrontConfig } from '@/schemas/checkout';
import type { OrderConfirmation } from '@/schemas/orders';
import { storefrontConfigSchema } from '@/schemas/checkout';
import { orderConfirmationSchema } from '@/schemas/orders';
import API_ENDPOINTS from '@/config/api-endpoints';
import api from '@/lib/axios';

export const getStorefrontConfig = async (): Promise<StorefrontConfig> => {
  const res = await api.get(API_ENDPOINTS.orders.storefrontConfig);
  return storefrontConfigSchema.parse(res.data);
};

export const checkout = async (
  payload: CheckoutRequest,
): Promise<OrderConfirmation> => {
  const res = await api.post(API_ENDPOINTS.orders.checkout, payload);
  return orderConfirmationSchema.parse(res.data);
};

export const getOrderConfirmation = async (
  orderId: string,
): Promise<OrderConfirmation> => {
  const res = await api.get(API_ENDPOINTS.orders.confirmation(orderId));
  return orderConfirmationSchema.parse(res.data);
};
