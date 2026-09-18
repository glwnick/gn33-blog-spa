import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';
import { useAuth } from '@/context/auth-provider';

export const Route = createFileRoute('/_auth')({
  beforeLoad: ({ context, location }) => {
    // Wait for the initial session refresh to resolve before judging `accessToken`.
    // Otherwise a real, not-yet-confirmed session reads as "no session" during that
    // window and gets wrongly bounced to /login - harmless under the old client-only
    // gate in main.tsx (the router never mounted until this resolved), but load-bearing
    // once the router can mount immediately, as SSR requires.
    if (context.auth.isInitializing) {
      return;
    }
    // `user`, not `accessToken`: the server-resolved snapshot (`lib/server-auth.ts`) always nulls the
    // token - it must never enter the document - but always carries the real `user` for an authenticated
    // visitor, so this is the one field that means "logged in" on both the client and the server.
    if (!context.auth.user) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      });
    }
    if (
      !context.auth.user.termsAccepted ||
      !context.auth.user.gdprConsentGiven
    ) {
      throw redirect({
        to: '/terms',
      });
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  const { user } = useAuth();
  if (!user) {
    return null;
  }
  // No layout chrome of its own: navigation lives in the root's `TopNav`, which is shared with the public routes.
  return <Outlet />;
}
