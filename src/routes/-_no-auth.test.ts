import { describe, expect, it } from 'vitest';
import { Route } from './_no-auth';
import {
  captureRedirect,
  createAuthContext,
  createAuthUser,
} from '@/test/auth-fixtures';

const runBeforeLoad = (
  auth: ReturnType<typeof createAuthContext>,
  pathname: string,
  search: { redirect?: string } = {},
) =>
  Route.options.beforeLoad!({
    context: { auth },
    search,
    location: { pathname },
  } as any);

describe('_no-auth beforeLoad', () => {
  it('lets an anonymous visitor through to /login', () => {
    const err = captureRedirect(() =>
      runBeforeLoad(createAuthContext(), '/login'),
    );

    expect(err).toBeUndefined();
  });

  it('bounces an authenticated visitor from /login to / by default', () => {
    const err = captureRedirect(() =>
      runBeforeLoad(createAuthContext({ accessToken: 'token', user: createAuthUser() }), '/login'),
    );

    expect(err?.options.to).toBe('/');
  });

  it('honours an explicit ?redirect= for an authenticated visitor', () => {
    const err = captureRedirect(() =>
      runBeforeLoad(
        createAuthContext({ accessToken: 'token', user: createAuthUser() }),
        '/login',
        { redirect: '/terms' },
      ),
    );

    expect(err?.options.to).toBe('/terms');
  });

  it.each(['/about', '/contact', '/contact/'])(
    'never bounces an authenticated visitor away from the bypass path %s',
    (pathname) => {
      const err = captureRedirect(() =>
        runBeforeLoad(createAuthContext({ accessToken: 'token', user: createAuthUser() }), pathname),
      );

      expect(err).toBeUndefined();
    },
  );

  // No longer hypothetical. It described a gate in `main.tsx` that stopped `beforeLoad` from ever
  // observing `isInitializing: true`; that file is gone (the providers live in `router.tsx`'s `Wrap`
  // now), and slice 6b-2's hydration seed produces exactly this shape on every cold load of an
  // authenticated page - `user` seeded from the server, `isInitializing` still true until
  // `AuthProvider`'s refresh effect resolves. Deferring here is what stops that window from bouncing
  // a signed-in visitor mid-hydration.
  it('does not redirect while auth is still initializing, even with a session already seeded', () => {
    const err = captureRedirect(() =>
      runBeforeLoad(
        createAuthContext({
          isInitializing: true,
          accessToken: 'token',
          user: createAuthUser(),
        }),
        '/login',
      ),
    );

    expect(err).toBeUndefined();
  });
});
