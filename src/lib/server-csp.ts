import { randomBytes } from 'node:crypto';
import { getRequest, setResponseHeader } from '@tanstack/react-start/server';

/**
 * One random nonce per request, threaded into `createRouter`'s `ssr.nonce` (`router.tsx`) so every
 * inline script TanStack Start and React's streaming renderer inject - the dehydration/streaming
 * barrier scripts, and (via `routes/__root.tsx`'s `RootDocument`) the theme-init script - carries it.
 *
 * `server.mjs` is a plain Node entry point outside the Vite/Start build (see its own header comment)
 * and owns the one `Content-Security-Policy-Report-Only` string, so this module cannot import that
 * policy directly. It instead publishes the nonce on a throwaway `X-Csp-Nonce` response header;
 * `server.mjs` reads it, interpolates the matching `'nonce-...'` source into `script-src`, and strips
 * the header before the response reaches the browser.
 *
 * Reached only through `createIsomorphicFn().server(...)` (see `router.tsx`), same rule as
 * `lib/server-auth.ts` and for the same reason: `@tanstack/react-start/server` does not exist in a
 * browser, and the build's import-protection plugin denies any client-reachable static import of it.
 */
const nonces = new WeakMap<Request, string>();

export function resolveServerNonce(): string {
  const request = getRequest();
  const existing = nonces.get(request);
  if (existing) return existing;
  const nonce = randomBytes(16).toString('base64');
  nonces.set(request, nonce);
  setResponseHeader('X-Csp-Nonce', nonce);
  return nonce;
}
