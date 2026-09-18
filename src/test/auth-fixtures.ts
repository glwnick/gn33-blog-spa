import { isRedirect } from '@tanstack/react-router';
import type { AuthSnapshot } from '@/lib/auth-token';
import type { AuthUser } from '@/types/api-types';

export const createAuthUser = (
  overrides: Partial<AuthUser> = {},
): AuthUser => ({
  userId: 'user-1',
  email: 'customer@example.com',
  fullName: 'Test Customer',
  enabled: true,
  accountNonExpired: true,
  accountExpiryDate: '2099-01-01',
  twoFactorType: 'NONE',
  signInType: 'FORM_LOGIN',
  roles: ['ROLE_USER'],
  preferredLanguage: 'EN',
  termsAccepted: true,
  gdprConsentGiven: true,
  picture: '',
  ...overrides,
});

/** The `context.auth` a route guard receives - the plain session snapshot, not the React context. */
export const createAuthContext = (
  overrides: Partial<AuthSnapshot> = {},
): AuthSnapshot => ({
  isInitializing: false,
  accessToken: null,
  user: null,
  ...overrides,
});

/**
 * `beforeLoad`/`redirect()` throws the plain `Response` object built by `redirect()`,
 * carrying the original navigation options on `.options`. Route guard tests care about
 * *where* it redirects, not that something merely threw, so capture it rather than
 * asserting with `toThrow()`.
 *
 * Anything that is *not* a redirect is rethrown: swallowing it would let a guard that crashes
 * read as `undefined`, i.e. indistinguishable from "let the visitor through".
 */
export const captureRedirect = (
  fn: () => unknown,
): { options: { to?: string; search?: unknown } } | undefined => {
  try {
    fn();
    return undefined;
  } catch (err) {
    if (!isRedirect(err)) {
      throw err;
    }
    return err;
  }
};
