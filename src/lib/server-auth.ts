import {
  getCookie,
  getRequest,
  setResponseHeader,
} from '@tanstack/react-start/server';
import type { AuthSnapshot } from './auth-token';
import type { AuthUser } from '@/types/api-types';
import env from '@/config/env';
import API_ENDPOINTS from '@/config/api-endpoints';

/**
 * Server-only session resolution for SSR (slice 6b-2 of `plans/PLAN-slice-6b-auth-ssr.md`), so `_auth`
 * pages and the global `TopNav` can render an authenticated visitor's real content in the first response
 * instead of the client-only shell they showed before this landed.
 *
 * Everything here reaches into `@tanstack/react-start/server`'s request-scoped accessors, which do not
 * exist in a browser. This module must only ever be reached through `createIsomorphicFn().server(...)`
 * (see `routes/__root.tsx`'s `beforeLoad`, `lib/axios.ts`'s request interceptor, `router.tsx`'s `dehydrate`
 * and `context/auth-provider.tsx`'s server snapshot) rather than a plain `import.meta.env.SSR` branch: the
 * build's import-protection plugin denies any client-reachable static import of
 * `@tanstack/react-start/server` outright, and only the isomorphic-fn compiler transform - not a runtime
 * branch a bundler would otherwise have to prove dead - satisfies it. Confirmed by grepping
 * `dist/client/assets/` for a string unique to this file (e.g. `exchangeRefreshTokenCookie`) and finding
 * nothing, then grepping `dist/server/` and finding it.
 */
type ServerSession = {
  /** Never exposed outside this module - see `getServerAccessToken()`. */
  accessToken: string | null;
  /**
   * What `context.auth` becomes (`__root.tsx`'s `beforeLoad` return value) and what `AuthProvider`'s
   * `useSyncExternalStore` uses as its server snapshot. `accessToken` is always `null` here: the router
   * serializes `context.auth` into the dehydrated stream 6b-1 wired up, and the real token must never enter
   * the document - see the plan's "the access token never enters the HTML" decision. Referentially stable
   * per request, since `useSyncExternalStore` requires its server snapshot not to change between calls
   * within the same render.
   */
  publicSnapshot: AuthSnapshot;
};

const ANONYMOUS_SESSION: ServerSession = {
  accessToken: null,
  publicSnapshot: { accessToken: null, user: null, isInitializing: false },
};

/**
 * Keyed on the `Request` object `getRequest()` returns for the render currently in flight, not on anything
 * this module manages itself. Two concurrent requests are two distinct keys, and each entry is
 * garbage-collected with its request - this is what keeps this module state from being the cross-visitor
 * leak CLAUDE.md's hard rule on SPA module scope warns against. Unlike `lib/auth-token.ts`'s single mutable
 * snapshot (safe only because nothing ever writes it on the server), there is no shared cell here at all.
 */
const sessions = new WeakMap<Request, ServerSession>();

async function exchangeRefreshTokenCookie(
  refreshToken: string,
): Promise<ServerSession> {
  // Bypasses the shared `lib/axios.ts` instance deliberately, and is the one call in the app justified in
  // doing so: this exchange is what *produces* the access token that instance's request interceptor would
  // otherwise try to attach before it exists, and a failure response here would recurse into that
  // instance's own response interceptor's `refreshSharedToken()`. A plain `fetch` also lets the one cookie
  // the server actually holds be forwarded explicitly - the server has no browser-managed cookie jar for
  // axios's `withCredentials` to draw from.
  try {
    const res = await fetch(`${env.API_URL}${API_ENDPOINTS.noAuth.refresh}`, {
      method: 'POST',
      headers: { Cookie: `refreshToken=${refreshToken}` },
    });
    if (!res.ok) {
      return ANONYMOUS_SESSION;
    }
    const data = (await res.json()) as {
      accessToken?: string;
      user?: AuthUser;
    };
    if (!data.accessToken || !data.user) {
      return ANONYMOUS_SESSION;
    }
    return {
      accessToken: data.accessToken,
      publicSnapshot: {
        accessToken: null,
        user: data.user,
        isInitializing: false,
      },
    };
  } catch {
    // Backend unreachable, cookie already expired server-side, etc. - fail closed to anonymous rather than
    // let a transient error bounce every authenticated visitor to /login for the length of the outage.
    return ANONYMOUS_SESSION;
  }
}

/**
 * Resolves the current request's session, recording it in `sessions` so every later synchronous read
 * in this module (`getServerAccessToken`, `getServerSessionSnapshot`) shares the one `/v1/auth/refresh`
 * exchange this call made rather than repeating it - nothing in this module calls this function itself,
 * so there is no second call within a request to memoize against. Called from `routes/__root.tsx`'s
 * `beforeLoad`, which the router fully awaits - for every matched route - before any loader or component
 * runs, so the recorded entry is already in place by the time anything else in this module is read.
 *
 * `Vary: Cookie` is set on every response, since which session (if any) got rendered always depends on
 * the cookie: the anonymous response is genuinely shareable across anonymous visitors but must never be
 * served to, or in place of, a signed-in one. `Cache-Control: private, no-store` is layered on top only
 * when a session is actually found, tied to the fact that produced the risk rather than to a URL list
 * that would drift: an anonymous `/` or `/shop` response stays cacheable, and only a response that
 * actually renders someone's session is marked private.
 */
export async function resolveServerSession(): Promise<AuthSnapshot> {
  const request = getRequest();
  const refreshToken = getCookie('refreshToken');

  const session = refreshToken
    ? await exchangeRefreshTokenCookie(refreshToken)
    : ANONYMOUS_SESSION;

  sessions.set(request, session);

  setResponseHeader('Vary', 'Cookie');
  if (session.publicSnapshot.user) {
    setResponseHeader('Cache-Control', 'private, no-store');
  }

  return session.publicSnapshot;
}

/**
 * Read by `lib/axios.ts`'s request interceptor, SSR branch only. `resolveServerSession()` has already been
 * awaited by `__root.tsx`'s `beforeLoad` by the time any loader - and therefore any request this
 * intercepts - runs, so this is a synchronous lookup and nothing else.
 */
export function getServerAccessToken(): string | null {
  return sessions.get(getRequest())?.accessToken ?? null;
}

/**
 * Read by `AuthProvider`'s `useSyncExternalStore` as its server snapshot, SSR branch only. Same timing
 * guarantee and the same `sessions` entry as `getServerAccessToken()` above.
 */
export function getServerSessionSnapshot(): AuthSnapshot {
  return (
    sessions.get(getRequest())?.publicSnapshot ??
    ANONYMOUS_SESSION.publicSnapshot
  );
}
