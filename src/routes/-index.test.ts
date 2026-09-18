import { describe, expect, it } from 'vitest';
import { Route } from './index';
import { captureRedirect, createAuthContext } from '@/test/auth-fixtures';

const runBeforeLoad = (auth: ReturnType<typeof createAuthContext>) =>
  Route.options.beforeLoad?.({ context: { auth } } as any);

// `/` is the shop landing page now (slice 6a of `plans/PLAN-shop-surfaces.md`), and it has no `beforeLoad` at
// all: a signed-in visitor sees the same storefront as everyone else instead of being bounced to `/home`.
// These cases guard against that redirect being reintroduced, for any of the sessions it used to key off.
describe('/ beforeLoad', () => {
  it.each([
    ['an anonymous visitor', createAuthContext()],
    ['an authenticated visitor', createAuthContext({ accessToken: 'token' })],
    // The regression the original file guarded, and the reason this case survives the rewrite: a real but
    // not-yet-resolved session must not be judged as either anonymous or authenticated.
    [
      'a still-initialising session',
      createAuthContext({ isInitializing: true }),
    ],
  ])('does not redirect %s away from the landing page', (_label, auth) => {
    const err = captureRedirect(() => runBeforeLoad(auth));

    expect(err).toBeUndefined();
  });
});
