import { describe, expect, it } from 'vitest';
import { Route } from './index';
import { captureRedirect, createAuthContext } from '@/test/auth-fixtures';

const runBeforeLoad = (auth: ReturnType<typeof createAuthContext>) =>
  Route.options.beforeLoad?.({ context: { auth } } as any);

// `/` is the public feed, and it has no `beforeLoad` at all: a signed-in visitor sees the same feed as
// everyone else instead of being bounced anywhere else. These cases guard against a redirect being
// reintroduced, for any of the sessions one might be tempted to key off.
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
