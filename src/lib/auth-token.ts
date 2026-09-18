import type { AuthUser } from '@/types/api-types';

/**
 * The session store. This module - not `AuthProvider`'s React state - is the single source of
 * truth for the current session, and `AuthProvider` is a thin `useSyncExternalStore` view over it.
 *
 * That direction matters, and getting it backwards caused two bugs worth not repeating:
 *
 * 1. `beforeLoad` runs outside the React tree (before anything renders, on both the server and the
 *    client), so it cannot call `useAuth()`. The root route reads `getAuthSnapshot()` instead. When
 *    this module was a *mirror* written from a `useEffect`, the store lagged React by a commit, so
 *    the root's `beforeLoad` could read a session that was already stale.
 * 2. `lib/axios.ts` refreshes the access token from outside React and writes it here. When React
 *    held the truth, the next `setUser(...)` re-ran the mirroring effect and wrote React's stale
 *    token back over the refreshed one, so every subsequent request carried an expired bearer.
 *
 * Both disappear if there is only one place the session lives. Writes are synchronous and notify
 * subscribers immediately, which is also what lets `__root.tsx` re-run route guards at exactly the
 * right moment - see `subscribeToAuthSnapshot`.
 *
 * Module state like this is normally an SSR hazard - a Node process serves many concurrent
 * requests, so a plain mutable module singleton can leak one visitor's data into another's
 * response. It is safe here only because nothing ever *writes* it on the server, and that is a
 * property to preserve, not a coincidence: a server-side write (a loader that logs someone in, say)
 * would make this cross-request shared state.
 *
 * Which is why the server's session lives somewhere else entirely. Since slice 6b-2, `_auth` pages
 * do server-render, and the session they render comes from `lib/server-auth.ts` - a `WeakMap` keyed
 * on the in-flight `Request`, so there is no shared cell to leak. Every consumer that needs the
 * session on both sides picks between the two through `createIsomorphicFn`: `routes/__root.tsx`'s
 * `beforeLoad`, `lib/axios.ts`'s request interceptor and `context/auth-provider.tsx`'s server
 * snapshot. This store is the client half of that pair and only the client half.
 */
export type AuthSnapshot = {
  accessToken: string | null;
  user: AuthUser | null;
  isInitializing: boolean;
};

/**
 * The starting value of this store, on the client. It is no longer what a server render sees:
 * since slice 6b-2, `AuthProvider` passes `getServerSessionSnapshot()` as `useSyncExternalStore`'s
 * `getServerSnapshot`, so the server renders the real per-request session instead of this.
 * Must stay referentially stable.
 */
export const INITIAL_AUTH_SNAPSHOT: AuthSnapshot = {
  accessToken: null,
  user: null,
  isInitializing: true,
};

let authSnapshot: AuthSnapshot = INITIAL_AUTH_SNAPSHOT;

const listeners = new Set<() => void>();

/**
 * Notified synchronously on every change. `AuthProvider` subscribes to render the session;
 * `__root.tsx` subscribes to invalidate the router so route guards re-run against it.
 */
export const subscribeToAuthSnapshot = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** Referentially stable between writes, as `useSyncExternalStore` requires. */
export const getAuthSnapshot = () => authSnapshot;

export const updateAuthSnapshot = (patch: Partial<AuthSnapshot>) => {
  const next = { ...authSnapshot, ...patch };
  if (
    next.accessToken === authSnapshot.accessToken &&
    next.user === authSnapshot.user &&
    next.isInitializing === authSnapshot.isInitializing
  ) {
    return;
  }
  authSnapshot = next;
  for (const listener of [...listeners]) {
    listener();
  }
};

/** Test-only: module state outlives a single `render()`, so suites must reset it explicitly. */
export const resetAuthSnapshot = () => {
  authSnapshot = INITIAL_AUTH_SNAPSHOT;
};

export const setStoredAccessToken = (token: string | null) => {
  updateAuthSnapshot({ accessToken: token });
};

export const getStoredAccessToken = () => authSnapshot.accessToken;

/**
 * Handler invoked when the session can no longer be recovered (a token refresh failed).
 * Registered by the auth provider so non-React modules (e.g. the axios interceptor) can trigger a logout + redirect.
 */
let unauthenticatedHandler: (() => void) | null = null;

export const setUnauthenticatedHandler = (handler: (() => void) | null) => {
  unauthenticatedHandler = handler;
};

export const notifyUnauthenticated = () => {
  unauthenticatedHandler?.();
};
