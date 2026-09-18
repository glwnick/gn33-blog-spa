import { describe, expect, it } from 'vitest';
import { Route } from './_auth';
import {
  captureRedirect,
  createAuthContext,
  createAuthUser,
} from '@/test/auth-fixtures';

const runBeforeLoad = (
  auth: ReturnType<typeof createAuthContext>,
  href = '/profile',
) =>
  // `beforeLoad` only reads `context.auth` and `location.href` in this route, so a
  // partial location is enough and keeps the call site readable.
  Route.options.beforeLoad!({ context: { auth }, location: { href } } as any);

describe('_auth beforeLoad', () => {
  it('redirects to /login with the target location preserved when there is no session', () => {
    const err = captureRedirect(() =>
      runBeforeLoad(createAuthContext(), '/products/knitted-bear'),
    );

    expect(err?.options.to).toBe('/login');
    expect(err?.options.search).toEqual({ redirect: '/products/knitted-bear' });
  });

  // Regression guard for the SSR migration: the old `main.tsx` refused to mount the router at
  // all until `auth.isInitializing` settled, which made this route's lack of an explicit
  // initializing check harmless. That file is gone (the providers live in `router.tsx`'s `Wrap`
  // now) and the router mounts immediately, so this route runs `beforeLoad` while the session is
  // still unconfirmed - on every cold load of an authenticated page, since slice 6b-2's hydration
  // seed leaves `isInitializing` true until `AuthProvider`'s refresh effect resolves. Bouncing
  // that window to `/login` is exactly the bug neither the migration nor 6b-2 may introduce.
  it('does not redirect a not-yet-resolved session while auth is still initializing', () => {
    const err = captureRedirect(() =>
      runBeforeLoad(createAuthContext({ isInitializing: true })),
    );

    expect(err).toBeUndefined();
  });

  it('redirects to /terms when the session exists but consent is outstanding', () => {
    const err = captureRedirect(() =>
      runBeforeLoad(
        createAuthContext({
          accessToken: 'token',
          user: createAuthUser({ termsAccepted: false }),
        }),
      ),
    );

    expect(err?.options.to).toBe('/terms');
  });

  it('redirects to /terms when GDPR consent specifically is outstanding', () => {
    const err = captureRedirect(() =>
      runBeforeLoad(
        createAuthContext({
          accessToken: 'token',
          user: createAuthUser({ gdprConsentGiven: false }),
        }),
      ),
    );

    expect(err?.options.to).toBe('/terms');
  });

  it('lets a fully authenticated, consented visitor through', () => {
    const err = captureRedirect(() =>
      runBeforeLoad(
        createAuthContext({ accessToken: 'token', user: createAuthUser() }),
      ),
    );

    expect(err).toBeUndefined();
  });

  // Slice 6b-2 (`plans/PLAN-slice-6b-auth-ssr.md`): `lib/server-auth.ts` never puts a real access
  // token in `context.auth` - it must not enter the document - so the snapshot it resolves for an
  // authenticated visitor looks exactly like this: `user` present, `accessToken` null. The guard has
  // to key off `user`, not `accessToken`, or this shape would be wrongly bounced to /login on every
  // server render of an `_auth` page.
  it('lets a server-resolved session through even though it carries no access token', () => {
    const err = captureRedirect(() =>
      runBeforeLoad(
        createAuthContext({
          accessToken: null,
          user: createAuthUser(),
          isInitializing: false,
        }),
      ),
    );

    expect(err).toBeUndefined();
  });
});
