import { queryOptions, useMutation } from '@tanstack/react-query';
import {
  getPushPublicKey,
  subscribeToPush,
  unsubscribeFromPush,
} from '@/api/push-api';
import { DEFAULT_STALE_TIME } from '@/config/query';

export const PUSH_PUBLIC_KEY_KEY = 'push-public-key' as const;

// Fetched lazily (enabled-gated) only once the push opt-in UI is actually engaged, not on every render of a
// page that happens to host the toggle.
export const pushPublicKeyOptions = (enabled: boolean) =>
  queryOptions({
    queryKey: [PUSH_PUBLIC_KEY_KEY],
    queryFn: getPushPublicKey,
    staleTime: DEFAULT_STALE_TIME,
    enabled,
  });

export const useSubscribeToPushMutation = () =>
  useMutation({ mutationFn: subscribeToPush });

export const useUnsubscribeFromPushMutation = () =>
  useMutation({ mutationFn: unsubscribeFromPush });
