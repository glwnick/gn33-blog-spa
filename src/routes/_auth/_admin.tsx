import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth/_admin')({
  beforeLoad: ({ context }) => {
    // `/home`, not `/`: matches `_manager`'s own redirect and keeps every role-guard bounce landing
    // on the account dashboard rather than sending a signed-in visitor back out to the public shop.
    if (!context.auth.user?.roles.includes('ROLE_ADMIN')) {
      throw redirect({
        to: '/home',
      });
    }
  },
});
