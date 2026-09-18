import '@/lib/i18n';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from './auth-provider';
import { createAuthUser } from '@/test/auth-fixtures';
import {
  getAuthSnapshot,
  resetAuthSnapshot,
  subscribeToAuthSnapshot,
} from '@/lib/auth-token';

const { refreshAccessToken } = vi.hoisted(() => ({
  refreshAccessToken: vi.fn(),
}));

vi.mock('@/api/auth-api', () => ({ refreshAccessToken }));

describe('AuthProvider', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    // The session lives in a module store (see `lib/auth-token.ts`), which outlives `render()` -
    // without this, one test's adopted session becomes the next test's starting state.
    resetAuthSnapshot();
  });

  // This is the state SSR renders with: the refresh effect never runs on the server,
  // so a server-rendered route only ever sees `isInitializing: true`. A route guard
  // that redirects on anything other than this exact starting shape is testing a
  // state the app never actually starts in.
  it('starts initializing, with no session', () => {
    refreshAccessToken.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    expect(result.current.isInitializing).toBe(true);
    expect(result.current.accessToken).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it('adopts the refreshed session and stops initializing once the refresh resolves', async () => {
    const user = createAuthUser();
    refreshAccessToken.mockResolvedValue({
      accessToken: 'refreshed-token',
      user,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => expect(result.current.isInitializing).toBe(false));

    expect(result.current.accessToken).toBe('refreshed-token');
    expect(result.current.user).toEqual(user);
  });

  it('stops initializing with no session when the refresh fails', async () => {
    refreshAccessToken.mockRejectedValue(new Error('no refresh token'));

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => expect(result.current.isInitializing).toBe(false));

    expect(result.current.accessToken).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it('logout clears an adopted session', async () => {
    refreshAccessToken.mockResolvedValue({
      accessToken: 'refreshed-token',
      user: createAuthUser(),
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => expect(result.current.isInitializing).toBe(false));

    act(() => result.current.logout());

    expect(result.current.accessToken).toBeNull();
    expect(result.current.user).toBeNull();
  });

  // The load-bearing half of the SSR guard fix. Every guard defers while `isInitializing` is true
  // (see `-_auth.test.ts`), and the first `beforeLoad` pass always runs in that window - so unless
  // *something* re-runs the guards afterwards, the deferred verdict is the only one ever reached
  // and `_auth` becomes permanently open. `__root.tsx` subscribes to this notification and calls
  // `router.invalidate()`; here we assert the provider actually emits it.
  it('notifies the auth store when the session resolves, so route guards can re-run', async () => {
    refreshAccessToken.mockResolvedValue({
      accessToken: 'refreshed-token',
      user: createAuthUser(),
    });
    const settled: Array<boolean> = [];
    const unsubscribe = subscribeToAuthSnapshot(() =>
      settled.push(getAuthSnapshot().isInitializing),
    );

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.isInitializing).toBe(false));
    unsubscribe();

    expect(settled.at(-1)).toBe(false);
  });

  it('notifies the auth store when the session resolves to no session at all', async () => {
    refreshAccessToken.mockRejectedValue(new Error('no refresh token'));
    const listener = vi.fn();
    const unsubscribe = subscribeToAuthSnapshot(listener);

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.isInitializing).toBe(false));
    unsubscribe();

    // Without this an anonymous deep link to /profile never gets bounced to /login: the guard
    // already deferred, and nothing tells the router the answer is now known.
    expect(listener).toHaveBeenCalled();
    expect(getAuthSnapshot()).toMatchObject({
      isInitializing: false,
      accessToken: null,
    });
  });
});
