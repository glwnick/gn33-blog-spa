import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth/_manager')({
  beforeLoad: ({ context }) => {
    const isManager =
      context.auth.user?.roles.includes('ROLE_MANAGER') ||
      context.auth.user?.roles.includes('ROLE_ADMIN');

    if (!isManager) {
      throw redirect({ to: '/' });
    }
  },
});
