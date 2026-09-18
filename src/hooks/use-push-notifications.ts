import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { urlBase64ToUint8Array } from '@/lib/web-push';
import {
  pushPublicKeyOptions,
  useSubscribeToPushMutation,
  useUnsubscribeFromPushMutation,
} from '@/query-options/push-options';
import env from '@/config/env';

export type PushStatus =
  | 'checking'
  | 'unsupported'
  | 'denied'
  | 'unsubscribed'
  | 'subscribed';

const SERVICE_WORKER_URL = '/sw.js';

const isSupported = (): boolean =>
  'serviceWorker' in navigator && 'PushManager' in window;

// Lets the worker reach the backend on its own later (see sw.js's pushsubscriptionchange handler), since a
// static public/ asset has no access to Vite's import.meta.env at runtime.
const sendConfigToWorker = async (): Promise<void> => {
  const registration = await navigator.serviceWorker.ready;
  registration.active?.postMessage({
    // Must stay in step with the matching check in public/sw.js: a mismatch makes the worker silently
    // ignore the config, which only shows up much later as a failed pushsubscriptionchange self-heal.
    type: 'gn33-blog-push-config',
    apiBaseUrl: env.API_URL,
  });
};

/**
 * Browser-level Web Push opt-in: registers the service worker (idempotent, safe to call every mount),
 * reflects the current permission/subscription state, and exposes enable/disable actions. Permission is only
 * ever requested from {@link enable}, never on mount - a browser cannot be re-prompted once denied, and
 * auto-prompting on load is the documented anti-pattern this deliberately avoids.
 */
export function usePushNotifications() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<PushStatus>('checking');
  const { mutateAsync: subscribeMutate, isPending: isSubscribing } =
    useSubscribeToPushMutation();
  const { mutateAsync: unsubscribeMutate, isPending: isUnsubscribing } =
    useUnsubscribeFromPushMutation();

  // Whether the backend has a VAPID keypair at all. Fetched only for browsers that support push (no point
  // otherwise) and cached like any other query, so this is one cheap request, not a per-render fetch. When the
  // key is null/empty the server has push turned off, so the opt-in must stay hidden rather than offer a button
  // that would fail on subscribe - mirroring the backend's own "no keys = clean no-op" posture.
  const { data: publicKeyData } = useQuery(pushPublicKeyOptions(isSupported()));
  const isConfigured = publicKeyData
    ? Boolean(publicKeyData.publicKey)
    : undefined;

  const refreshStatus = useCallback(async () => {
    if (!isSupported()) {
      setStatus('unsupported');
      return;
    }
    if (Notification.permission === 'denied') {
      setStatus('denied');
      return;
    }
    const registration =
      await navigator.serviceWorker.register(SERVICE_WORKER_URL);
    void sendConfigToWorker();
    const subscription = await registration.pushManager.getSubscription();
    setStatus(subscription ? 'subscribed' : 'unsubscribed');
  }, []);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  const enable = useCallback(async () => {
    if (!isSupported()) {
      setStatus('unsupported');
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      setStatus(permission === 'denied' ? 'denied' : 'unsubscribed');
      return;
    }

    const registration =
      await navigator.serviceWorker.register(SERVICE_WORKER_URL);
    void sendConfigToWorker();
    const { publicKey } = await queryClient.fetchQuery(
      pushPublicKeyOptions(true),
    );
    if (!publicKey) {
      // Server has no VAPID key (push disabled): nothing to subscribe to. The UI hides the button in this
      // state, so this only guards a race; leave the member unsubscribed rather than throwing.
      setStatus('unsubscribed');
      return;
    }
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
    const json = subscription.toJSON();
    try {
      await subscribeMutate({
        endpoint: json.endpoint!,
        p256dh: json.keys!.p256dh,
        auth: json.keys!.auth,
        userAgent: navigator.userAgent,
      });
    } catch (error) {
      // Roll back the browser subscription so a failed POST does not leave a live push subscription with no
      // server row - which would otherwise report 'subscribed' on next load yet never deliver.
      await subscription.unsubscribe().catch(() => {});
      throw error;
    }
    setStatus('subscribed');
  }, [queryClient, subscribeMutate]);

  const disable = useCallback(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    if (subscription) {
      await unsubscribeMutate(subscription.endpoint);
      await subscription.unsubscribe();
    }
    setStatus('unsubscribed');
  }, [unsubscribeMutate]);

  return {
    status,
    isConfigured,
    enable,
    disable,
    isBusy: isSubscribing || isUnsubscribing,
  };
}
