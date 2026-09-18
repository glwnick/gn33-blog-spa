import { createFileRoute } from '@tanstack/react-router';
import z from 'zod';
import { VerifyEmailPage } from '@/pages/verify-email-page';

/** M4, SECURITY-AUDIT-2026-09-15.md: destination of the order-confirmation email's verification link. */
export const Route = createFileRoute('/_no-auth/verify-email/')({
  validateSearch: z.object({
    token: z.string().optional(),
  }),
  component: () => {
    const { token } = Route.useSearch();
    return <VerifyEmailPage token={token} />;
  },
});
