import type { AuthUser } from '@/types/api-types';
import { updateAuthSnapshot } from '@/lib/auth-token';

/**
 * What `router.tsx`'s `dehydrate` puts in the document about the session. Never the access token - see
 * `lib/server-auth.ts`'s header for why it must not enter the HTML.
 */
export type DehydratedAuth = {
  user: AuthUser | null;
  /**
   * Whether the request carried a refresh cookie. That cookie is httpOnly, so only the server can say.
   * False means the visitor is anonymous and a `/v1/auth/refresh` could only fail.
   */
  hasRefreshCookie: boolean;
};

/**
 * Seeds `lib/auth-token.ts`'s store from the server's resolved session, before the client's first render.
 *
 * - A server-resolved `user`: seeded with `isInitializing` still `true`, so `AuthProvider`'s refresh effect
 *   supplies the real access token (which the seed never carried) and flips it to `false`.
 * - No user and no refresh cookie: resolved as anonymous right here, sparing every anonymous page load a
 *   doomed `/v1/auth/refresh` (a 400 "No refreshToken!" that shows up as a console error).
 * - No user but a cookie present (the server's exchange failed, e.g. a backend blip): left initializing, so
 *   the client retries.
 *
 * The second case relies on the SPA server receiving the same refresh cookie the browser holds. That is true
 * whenever the API and the SPA share an origin (production, behind Caddy) or a hostname (local dev), and it
 * is the same assumption `lib/server-auth.ts` already makes to render a signed-in page at all. A topology in
 * which the API sets a cookie the SPA server never sees would make the server report "anonymous" for a user
 * who is signed in, and this would skip the client refresh that used to rescue them.
 */
export function hydrateAuth(dehydrated: DehydratedAuth): void {
  if (dehydrated.user) {
    updateAuthSnapshot({
      user: dehydrated.user,
      isInitializing: true,
      accessToken: null,
    });
  } else if (!dehydrated.hasRefreshCookie) {
    updateAuthSnapshot({ isInitializing: false });
  }
}
