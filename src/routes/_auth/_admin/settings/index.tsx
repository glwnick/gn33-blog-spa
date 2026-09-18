import { createFileRoute } from '@tanstack/react-router';
import { SettingsPage } from '@/pages/settings/settings-page';

export const Route = createFileRoute('/_auth/_admin/settings/')({
  component: SettingsPage,
});
