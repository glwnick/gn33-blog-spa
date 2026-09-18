// gn33-blog service worker: Web Push notifications only (no offline caching / asset precache in v1).

const CONFIG_CACHE = 'gn33-blog-push-config-v1';
const CONFIG_KEY = 'config';

async function getConfig() {
  const cache = await caches.open(CONFIG_CACHE);
  const res = await cache.match(CONFIG_KEY);
  return res ? res.json() : null;
}

async function setConfig(config) {
  const cache = await caches.open(CONFIG_CACHE);
  await cache.put(CONFIG_KEY, new Response(JSON.stringify(config)));
}

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// The client posts its API base URL right after registering (see usePushNotifications) so this worker can
// still reach the backend later, even with no tab open - see the pushsubscriptionchange handler below.
self.addEventListener('message', (event) => {
  const data = event.data;
  if (data && data.type === 'gn33-blog-push-config' && data.apiBaseUrl) {
    event.waitUntil(setConfig({ apiBaseUrl: data.apiBaseUrl }));
  }
});

self.addEventListener('push', (event) => {
  let payload = { title: 'gn33', body: '' };
  try {
    if (event.data) {
      payload = event.data.json();
    }
  } catch {
    // Non-JSON payload: fall back to the default title/body above.
  }
  const { title, body, url } = payload;
  event.waitUntil(
    self.registration.showNotification(title || 'gn33', {
      body: body || '',
      icon: '/nLogoColorBG.svg',
      badge: '/nLogoColorBG.svg',
      data: { url: url || '/' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    (async () => {
      const clientsList = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      for (const client of clientsList) {
        if ('focus' in client) {
          const clientUrl = new URL(client.url);
          if (clientUrl.origin === self.location.origin) {
            await client.focus();
            if ('navigate' in client) {
              await client.navigate(targetUrl);
            }
            return;
          }
        }
      }
      await self.clients.openWindow(targetUrl);
    })(),
  );
});

// Best-effort self-heal for a browser-initiated subscription rotation. The new VAPID key comes straight off
// the old subscription's own options (no server round-trip needed for that part); the backend is then updated
// using a freshly refreshed access token via the cookie-based refresh endpoint - the same mechanism the app
// itself uses, so this works even with no tab open, as long as the refresh-token cookie is still valid. If the
// config was never learned (a brand new worker that has not yet talked to a client) or the refresh fails, this
// silently gives up: the next app open re-detects the mismatch and re-subscribes like a fresh opt-in.
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async () => {
      const applicationServerKey =
        event.oldSubscription && event.oldSubscription.options
          ? event.oldSubscription.options.applicationServerKey
          : null;
      if (!applicationServerKey) {
        return;
      }

      const config = await getConfig();
      if (!config || !config.apiBaseUrl) {
        return;
      }

      try {
        const subscription = await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });

        const refreshRes = await fetch(`${config.apiBaseUrl}/v1/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });
        if (!refreshRes.ok) {
          return;
        }
        const { accessToken } = await refreshRes.json();
        if (!accessToken) {
          return;
        }

        const json = subscription.toJSON();
        await fetch(`${config.apiBaseUrl}/v1/push/subscriptions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: 'include',
          body: JSON.stringify({
            endpoint: json.endpoint,
            p256dh: json.keys.p256dh,
            auth: json.keys.auth,
            userAgent: null,
          }),
        });
      } catch {
        // Best-effort: give up silently, self-heals on next app open instead.
      }
    })(),
  );
});
