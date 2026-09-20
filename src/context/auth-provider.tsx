import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';
import { createIsomorphicFn } from '@tanstack/react-start';
import type { ReactNode } from 'react';
import type { AuthUser } from '@/types/api-types';
import type { TwoFactorType } from '@/schemas/common';
import { useLanguageAndFormat } from '@/hooks/use-translation';
import { refreshAccessToken } from '@/api/auth-api';
import {
  getAuthSnapshot,
  setUnauthenticatedHandler,
  subscribeToAuthSnapshot,
  updateAuthSnapshot,
} from '@/lib/auth-token';
import { getServerSessionSnapshot } from '@/lib/server-auth';

const getSyncedServerSnapshot = createIsomorphicFn()
  .client(() => getAuthSnapshot())
  .server(() => getServerSessionSnapshot());

type TwoFactorResponse = {
  token: string;
  type: TwoFactorType;
};
type LoginResponse = {
  accessToken: string;
  user: AuthUser;
};

export type AuthContextType = {
  isInitializing: boolean;
  accessToken: string | null;
  user: AuthUser | null;
  login: (authResponse: LoginResponse) => void;
  logout: () => void;
  setUser: (user: AuthUser | null) => void;
  twoFactorLogin: (twoFactorResponse: TwoFactorResponse | null) => void;
  twoFactorData: TwoFactorResponse | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Routes reachable without a session (the `_no-auth` route group + `/`) — a failed
// background refresh must NOT bounce the user away from these.
// `/terms` is deliberately excluded: it requires a session (its own `beforeLoad` already
// redirects to `/login` without one), so a dead session there should bounce to
// `/login?redirect=%2Fterms` rather than being left to 401 on every accept click.
// Keep in sync with src/routes/_no-auth/*.
const PUBLIC_PATHS = new Set([
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/two-factor-auth',
  '/about',
  '/contact',
]);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // `lib/auth-token.ts` owns the session, not this component - see its header for why the
  // dependency points this way. `useSyncExternalStore`'s server snapshot is used for real server
  // rendering *and* for the client's hydration pass (React calls it in both), which is why the two
  // environments need different getters here:
  // - On the server, `lib/auth-token.ts`'s own store is never written (see its header), so it would
  //   always read as anonymous. `getServerSessionSnapshot()` reads the real per-request session
  //   instead, already resolved by `routes/__root.tsx`'s `beforeLoad` before any component renders.
  // - On the client, it is the *same* `getAuthSnapshot` passed as the normal snapshot getter below.
  //   That only produces a hydration match because `router.tsx`'s `hydrate` seeds the store from the
  //   server's session before `hydrateRoot()` runs, so by the time this hydrates, `getAuthSnapshot()`
  //   already answers the way the server did - no separate frozen "anonymous" server snapshot to fall
  //   back on, and no mismatch to warn about.
  const { accessToken, user, isInitializing } = useSyncExternalStore(
    subscribeToAuthSnapshot,
    getAuthSnapshot,
    getSyncedServerSnapshot,
  );
  const [twoFactorData, setTwoFactorData] = useState<TwoFactorResponse | null>(
    null,
  );
  const { setLanguageAndFormat } = useLanguageAndFormat();

  const setUser = useCallback((nextUser: AuthUser | null) => {
    updateAuthSnapshot({ user: nextUser });
  }, []);

  const login = useCallback(
    (authResponse: LoginResponse) => {
      updateAuthSnapshot({
        accessToken: authResponse.accessToken,
        user: authResponse.user,
      });
      setTwoFactorData(null);

      setLanguageAndFormat(authResponse.user.preferredLanguage);
    },
    [setLanguageAndFormat],
  );

  const twoFactorLogin = useCallback(
    (twoFactorResponse: TwoFactorResponse | null) => {
      setTwoFactorData(twoFactorResponse);
    },
    [],
  );

  const logout = useCallback(() => {
    updateAuthSnapshot({ accessToken: null, user: null });
  }, []);

  // Let non-React modules (the axios interceptor) end the session when a token refresh fails.
  useEffect(() => {
    setUnauthenticatedHandler(() => {
      logout();
      const { pathname, search, hash } = globalThis.location;
      if (!PUBLIC_PATHS.has(pathname)) {
        // Preserve the full in-app location (path + query + hash), encoded so the
        // outer /login?redirect=... query stays valid.
        const target = encodeURIComponent(pathname + search + hash);
        globalThis.location.href = `/login?redirect=${target}`;
      }
    });
    return () => setUnauthenticatedHandler(null);
  }, [logout]);

  useEffect(() => {
    // Already resolved before mount: `hydrateAuth` (`lib/dehydrated-auth.ts`) found the server saw no refresh
    // cookie, so the visitor is anonymous and the exchange could only fail.
    if (!getAuthSnapshot().isInitializing) return;

    const loadAuth = async () => {
      try {
        const response = await refreshAccessToken();
        if (response.accessToken && response.user) {
          login({ accessToken: response.accessToken, user: response.user });
        }
      } catch (err: unknown) {
        // Token refresh failed - user is not authenticated
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.log('Token refresh failed:', message);
        logout();
      } finally {
        // Always mark initialization as complete. Route guards defer to this flag rather than
        // judging `accessToken` while it is still unknown, and `__root.tsx` re-runs them the
        // moment it clears - see `_auth.tsx`.
        updateAuthSnapshot({ isInitializing: false });
      }
    };

    loadAuth();
  }, [login, logout]);

  const value = useMemo(
    () => ({
      isInitializing,
      accessToken,
      user,
      login,
      logout,
      setUser,
      twoFactorLogin,
      twoFactorData,
    }),
    [
      isInitializing,
      accessToken,
      user,
      login,
      logout,
      setUser,
      twoFactorLogin,
      twoFactorData,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within a provider');
  return context;
};
