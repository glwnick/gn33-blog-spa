import { createFileRoute } from '@tanstack/react-router';
import { Contact } from '@/components/contact';

export const Route = createFileRoute('/_no-auth/contact/')({
  component: Contact,
});
