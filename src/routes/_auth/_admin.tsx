import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth/_admin')({
  beforeLoad: ({ context }) => {
    // Matches `_manager`'s own redirect: bounce a non-admin back to the public feed every visitor sees.
    if (!context.auth.user?.roles.includes('ROLE_ADMIN')) {
      throw redirect({
        to: '/',
      });
    }
  },
});
