import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getServerAccessToken,
  getServerSessionSnapshot,
  resolveServerSession,
  serverHasRefreshCookie,
} from './server-auth';
import { createAuthUser } from '@/test/auth-fixtures';

const { getCookie, getRequest, setResponseHeader } = vi.hoisted(() => ({
  getCookie: vi.fn(),
  getRequest: vi.fn(),
  setResponseHeader: vi.fn(),
}));

vi.mock('@tanstack/react-start/server', () => ({
  getCookie,
  getRequest,
  setResponseHeader,
}));

describe('server-auth', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    // `getCookie`/`getRequest`/`setResponseHeader` are `vi.hoisted()`, so they - and their call
    // history - are shared across every test in this file unless cleared.
    vi.clearAllMocks();
  });

  it('resolves an anonymous, still-cacheable snapshot when there is no refresh cookie', async () => {
    getRequest.mockReturnValue(new Request('http://localhost/'));
    getCookie.mockReturnValue(undefined);

    const auth = await resolveServerSession();

    expect(auth).toEqual({
      accessToken: null,
      user: null,
      isInitializing: false,
    });
    // `Vary: Cookie` always, so a shared cache never serves this anonymous response back to a
    // signed-in visitor - but no `Cache-Control: private`, since this response has nothing to protect.
    expect(setResponseHeader).toHaveBeenCalledWith('Vary', 'Cookie');
    expect(setResponseHeader).not.toHaveBeenCalledWith(
      'Cache-Control',
      expect.anything(),
    );
    expect(getServerAccessToken()).toBeNull();
  });

  it('exchanges the refresh cookie for a session and marks the response private, without the token leaking into the public snapshot', async () => {
    getRequest.mockReturnValue(new Request('http://localhost/home'));
    getCookie.mockReturnValue('refresh-token-1');
    const user = createAuthUser();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ accessToken: 'access-token-1', user }), {
          status: 200,
        }),
      ),
    );

    const auth = await resolveServerSession();

    expect(auth).toEqual({ accessToken: null, user, isInitializing: false });
    expect(getServerAccessToken()).toBe('access-token-1');
    expect(getServerSessionSnapshot()).toEqual(auth);
    expect(setResponseHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'private, no-store',
    );
    expect(setResponseHeader).toHaveBeenCalledWith('Vary', 'Cookie');
  });

  it('falls back to anonymous, without a private cache header, when the refresh call is rejected', async () => {
    getRequest.mockReturnValue(new Request('http://localhost/home'));
    getCookie.mockReturnValue('stale-refresh-token');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 401 })),
    );

    const auth = await resolveServerSession();

    expect(auth).toEqual({
      accessToken: null,
      user: null,
      isInitializing: false,
    });
    expect(setResponseHeader).not.toHaveBeenCalledWith(
      'Cache-Control',
      expect.anything(),
    );
    expect(getServerAccessToken()).toBeNull();
  });

  it('fails closed to anonymous, rather than throwing, when the backend is unreachable', async () => {
    getRequest.mockReturnValue(new Request('http://localhost/home'));
    getCookie.mockReturnValue('refresh-token-1');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('ECONNREFUSED')),
    );

    const auth = await resolveServerSession();

    expect(auth).toEqual({
      accessToken: null,
      user: null,
      isInitializing: false,
    });
  });

  // The cross-request-leak failure mode: catastrophic and silent if it ever regressed, so it gets a
  // direct unit test rather than being covered only end to end. Two concurrent requests, from two
  // different users, must resolve into two entries that cannot see each other.
  it('gives two distinct requests two distinct sessions, and neither can read the other', async () => {
    const requestA = new Request('http://localhost/home');
    const requestB = new Request('http://localhost/orders');
    const userA = createAuthUser({ userId: 'user-a', email: 'a@example.com' });
    const userB = createAuthUser({ userId: 'user-b', email: 'b@example.com' });

    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init?: RequestInit) => {
        const cookie = (init?.headers as Record<string, string>).Cookie;
        if (cookie === 'refreshToken=refresh-a') {
          return new Response(
            JSON.stringify({ accessToken: 'token-a', user: userA }),
            { status: 200 },
          );
        }
        if (cookie === 'refreshToken=refresh-b') {
          return new Response(
            JSON.stringify({ accessToken: 'token-b', user: userB }),
            { status: 200 },
          );
        }
        throw new Error(`unexpected cookie: ${cookie}`);
      }),
    );

    // Resolved out of order relative to which request "arrives" first, the way two concurrent
    // requests genuinely would - `resolveServerSession()` is keyed on whatever `getRequest()`
    // returns at the moment it is called, not on call order.
    getRequest.mockReturnValue(requestB);
    getCookie.mockReturnValue('refresh-b');
    await resolveServerSession();

    getRequest.mockReturnValue(requestA);
    getCookie.mockReturnValue('refresh-a');
    await resolveServerSession();

    getRequest.mockReturnValue(requestA);
    expect(getServerAccessToken()).toBe('token-a');
    expect(getServerSessionSnapshot().user).toEqual(userA);

    getRequest.mockReturnValue(requestB);
    expect(getServerAccessToken()).toBe('token-b');
    expect(getServerSessionSnapshot().user).toEqual(userB);
  });

  it('reports whether the request carried a refresh cookie', () => {
    getCookie.mockReturnValue(undefined);
    expect(serverHasRefreshCookie()).toBe(false);

    getCookie.mockReturnValue('refresh-token-1');
    expect(serverHasRefreshCookie()).toBe(true);
  });
});
