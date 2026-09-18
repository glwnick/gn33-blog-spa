// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthResponse } from '@/types/api-types';
import { refreshAccessToken } from '@/api/auth-api';
import { refreshSharedToken } from '@/lib/axios';
import { getStoredAccessToken, setStoredAccessToken } from '@/lib/auth-token';

// Avoid the real i18n side effects (init + language detector) when importing the axios module graph.
// vi.mock calls are hoisted above the imports above by the vitest transform.
vi.mock('@/lib/i18n', () => ({ getStoredLanguage: () => 'en', default: {} }));
vi.mock('@/api/auth-api', () => ({ refreshAccessToken: vi.fn() }));

const mockedRefresh = vi.mocked(refreshAccessToken);
const authResponse = (accessToken: string) =>
  ({ accessToken }) as unknown as AuthResponse;

describe('refreshSharedToken (single-flight)', () => {
  beforeEach(() => {
    mockedRefresh.mockReset();
    setStoredAccessToken(null);
  });

  it('coalesces concurrent refreshes into a single call', async () => {
    let resolveRefresh: (value: AuthResponse) => void = () => {};
    mockedRefresh.mockImplementation(
      () =>
        new Promise<AuthResponse>((resolve) => {
          resolveRefresh = resolve;
        }),
    );

    const first = refreshSharedToken();
    const second = refreshSharedToken();
    resolveRefresh(authResponse('new-token'));
    const [a, b] = await Promise.all([first, second]);

    expect(mockedRefresh).toHaveBeenCalledTimes(1);
    expect(a).toBe('new-token');
    expect(b).toBe('new-token');
    expect(getStoredAccessToken()).toBe('new-token');
  });

  it('starts a fresh refresh after the previous one settles', async () => {
    mockedRefresh.mockResolvedValue(authResponse('a'));
    await refreshSharedToken();
    await refreshSharedToken();
    expect(mockedRefresh).toHaveBeenCalledTimes(2);
  });

  it('propagates rejection and resets so a later retry is possible', async () => {
    mockedRefresh.mockRejectedValueOnce(new Error('refresh failed'));
    await expect(refreshSharedToken()).rejects.toThrow('refresh failed');

    mockedRefresh.mockResolvedValueOnce(authResponse('ok'));
    await expect(refreshSharedToken()).resolves.toBe('ok');
  });
});
