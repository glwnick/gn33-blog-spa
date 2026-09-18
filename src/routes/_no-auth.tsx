import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';
import z from 'zod';
import { isSafeRedirectTarget } from '@/lib/is-safe-redirect-target';

// Paths in this pathless group that should render for an already-authenticated
// visitor too, instead of being bounced back to `/`.
// Matched exactly, not by substring: a future `/contact-form` or `/about-billing`
// must opt in here deliberately rather than inheriting the bypass from its prefix.
const AUTH_BYPASS_PATHS = new Set(['/about', '/contact']);

const isAuthBypassPath = (pathname: string) =>
  // Tolerate a trailing slash so `/contact/` matches `/contact`.
  AUTH_BYPASS_PATHS.has(pathname.replace(/\/+$/, '') || '/');

export const Route = createFileRoute('/_no-auth')({
  // Client-only for now, `/about` and `/contact` included even though they're anonymous-safe:
  // Stage E of the public-catalogue plan is where static content pages are deliberately revisited
  // for SSR, not this migration step.
  ssr: false,
  validateSearch: z.object({
    redirect: z.string().optional(),
    // Set by the backend's OAuth2 success handler when it refuses to issue a session (see
    // OAuth2LoginSuccessHandler); the login page turns the code into a localized message.
    ssoError: z.string().optional(),
  }),
  beforeLoad: ({ context, search, location }) => {
    // Skip redirect check if still initializing
    if (context.auth.isInitializing) {
      return;
    }

    if (isAuthBypassPath(location.pathname)) {
      return;
    }
    // Redirect authenticated users away from register, to `/` - the public feed every visitor sees,
    // signed in or not - matching the same default the post-login handler already uses
    // (`login/index.tsx`), so every "you're already signed in" redirect lands in the same place.
    // `user`, not `accessToken` - see `_auth.tsx` for why that is the field that means "logged in"
    // on both sides. Identical behaviour while this subtree is still `ssr: false`, since the client
    // sets both together; it stops being identical the moment stage E lifts that flag.
    if (context.auth.user) {
      // L7, SECURITY-AUDIT-2026-09-15.md: only a root-relative path is honoured - see
      // isSafeRedirectTarget's own comment for why this is worth guarding even though the router
      // itself already keeps this from being an open redirect today.
      if (isSafeRedirectTarget(search.redirect)) {
        throw redirect({ to: search.redirect });
      } else {
        throw redirect({ to: '/' });
      }
    }
  },
  // The dark-mode toggle and language switcher that used to float in a corner here are in the global `TopNav` now,
  // so this layout only has to centre the card it wraps.
  component: () => (
    <div className="flex flex-1 items-center justify-center p-6 md:p-10">
      <Outlet />
    </div>
  ),
});
