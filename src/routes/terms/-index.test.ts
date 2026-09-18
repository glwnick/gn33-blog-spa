import { describe, expect, it } from 'vitest';
import { Route } from './index';
import {
  captureRedirect,
  createAuthContext,
  createAuthUser,
} from '@/test/auth-fixtures';

const runBeforeLoad = (auth: ReturnType<typeof createAuthContext>) =>
  Route.options.beforeLoad!({ context: { auth } } as any);

describe('/terms beforeLoad', () => {
  it('redirects to /login preserving /terms as the target when there is no session', () => {
    const err = captureRedirect(() => runBeforeLoad(createAuthContext()));

    expect(err?.options.to).toBe('/login');
    expect(err?.options.search).toEqual({ redirect: '/terms' });
  });

  // Same class of bug as `_auth.tsx` (see its regression test): without the `isInitializing` check
  // coming first, a real but not-yet-confirmed session reads as "no session" the instant the router
  // can mount before that resolves.
  it('does not redirect a not-yet-resolved session while auth is still initializing', () => {
    const err = captureRedirect(() =>
      runBeforeLoad(createAuthContext({ isInitializing: true })),
    );

    expect(err).toBeUndefined();
  });

  it('lets an authenticated visitor through regardless of consent state', () => {
    const err = captureRedirect(() =>
      runBeforeLoad(
        createAuthContext({
          accessToken: 'token',
          user: createAuthUser({
            termsAccepted: false,
            gdprConsentGiven: false,
          }),
        }),
      ),
    );

    expect(err).toBeUndefined();
  });

  // The shape `lib/server-auth.ts` resolves: `user` present, `accessToken` deliberately null so the
  // token never enters the document. `_auth` bounces an unconsented visitor here, so this guard
  // judging "logged in" by `accessToken` while `_auth` judges it by `user` would put the two in a
  // redirect loop the moment stage E server-renders this subtree.
  it('lets a server-resolved session through even though it carries no access token', () => {
    const err = captureRedirect(() =>
      runBeforeLoad(
        createAuthContext({
          accessToken: null,
          user: createAuthUser({ termsAccepted: false }),
        }),
      ),
    );

    expect(err).toBeUndefined();
  });
});
