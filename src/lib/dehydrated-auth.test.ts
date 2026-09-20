import { afterEach, describe, expect, it } from 'vitest';
import { hydrateAuth } from './dehydrated-auth';
import { createAuthUser } from '@/test/auth-fixtures';
import { getAuthSnapshot, resetAuthSnapshot } from '@/lib/auth-token';

describe('hydrateAuth', () => {
  afterEach(() => {
    resetAuthSnapshot();
  });

  it('resolves an anonymous visitor when the server saw no refresh cookie', () => {
    hydrateAuth({ user: null, hasRefreshCookie: false });

    expect(getAuthSnapshot()).toEqual({
      accessToken: null,
      user: null,
      isInitializing: false,
    });
  });

  it('keeps initializing when a refresh cookie was present but the server could not resolve it', () => {
    hydrateAuth({ user: null, hasRefreshCookie: true });

    expect(getAuthSnapshot().isInitializing).toBe(true);
    expect(getAuthSnapshot().user).toBeNull();
  });

  it('seeds the server-resolved user, still initializing so the client fetches the access token', () => {
    const user = createAuthUser();

    hydrateAuth({ user, hasRefreshCookie: true });

    expect(getAuthSnapshot()).toEqual({
      accessToken: null,
      user,
      isInitializing: true,
    });
  });
});
