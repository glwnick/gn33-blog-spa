import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getAuthSnapshot,
  getStoredAccessToken,
  notifyUnauthenticated,
  resetAuthSnapshot,
  setStoredAccessToken,
  setUnauthenticatedHandler,
  subscribeToAuthSnapshot,
  updateAuthSnapshot,
} from './auth-token';

describe('auth-token store', () => {
  beforeEach(() => {
    resetAuthSnapshot();
    setUnauthenticatedHandler(null);
  });

  it('stores and returns the access token', () => {
    expect(getStoredAccessToken()).toBeNull();
    setStoredAccessToken('abc');
    expect(getStoredAccessToken()).toBe('abc');
  });

  it('returns a referentially stable snapshot between writes, as useSyncExternalStore requires', () => {
    const first = getAuthSnapshot();

    expect(getAuthSnapshot()).toBe(first);

    updateAuthSnapshot({ accessToken: 'abc' });

    expect(getAuthSnapshot()).not.toBe(first);
    expect(getAuthSnapshot()).toBe(getAuthSnapshot());
  });

  // This notification is what `__root.tsx` turns into a `router.invalidate()`, and it has to be
  // synchronous with the new value already readable: the router re-reads `getAuthSnapshot()` when
  // it re-runs guards, so a deferred notification would re-guard against the session that was
  // just replaced.
  it('notifies subscribers synchronously, with the new value already visible', () => {
    const seen: Array<string | null> = [];
    subscribeToAuthSnapshot(() => seen.push(getStoredAccessToken()));

    updateAuthSnapshot({ accessToken: 'abc' });

    expect(seen).toEqual(['abc']);
  });

  it('does not notify when a write changes nothing', () => {
    updateAuthSnapshot({ accessToken: 'abc' });
    const listener = vi.fn();
    subscribeToAuthSnapshot(listener);

    updateAuthSnapshot({ accessToken: 'abc' });

    expect(listener).not.toHaveBeenCalled();
  });

  it('stops notifying once unsubscribed', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToAuthSnapshot(listener);

    unsubscribe();
    updateAuthSnapshot({ accessToken: 'abc' });

    expect(listener).not.toHaveBeenCalled();
  });

  // Regression guard: `lib/axios.ts` refreshes the token from outside React. While this module was
  // a mirror of React state, the next `user` change wrote the pre-refresh token back over it, and
  // every subsequent request carried an expired bearer. One store, one token, no clobber.
  it('keeps an out-of-band refreshed token across an unrelated user update', () => {
    updateAuthSnapshot({ accessToken: 'original' });
    setStoredAccessToken('refreshed-outside-react');

    updateAuthSnapshot({ isInitializing: false });

    expect(getStoredAccessToken()).toBe('refreshed-outside-react');
  });

  it('invokes the registered unauthenticated handler', () => {
    const handler = vi.fn();
    setUnauthenticatedHandler(handler);
    notifyUnauthenticated();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does nothing when no handler is registered', () => {
    setUnauthenticatedHandler(null);
    expect(() => notifyUnauthenticated()).not.toThrow();
  });
});
