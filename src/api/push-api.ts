import type { PushPublicKey, PushSubscriptionRequest } from '@/schemas/push';
import { pushPublicKeySchema } from '@/schemas/push';
import API_ENDPOINTS from '@/config/api-endpoints';
import api from '@/lib/axios';

export const getPushPublicKey = async (): Promise<PushPublicKey> => {
  const res = await api.get<PushPublicKey>(API_ENDPOINTS.push.publicKey);
  return pushPublicKeySchema.parse(res.data);
};

export const subscribeToPush = async (
  request: PushSubscriptionRequest,
): Promise<void> => {
  await api.post(API_ENDPOINTS.push.subscriptions, request);
};

export const unsubscribeFromPush = async (
  endpoint: string,
): Promise<void> => {
  await api.delete(API_ENDPOINTS.push.subscriptions, { data: { endpoint } });
};
