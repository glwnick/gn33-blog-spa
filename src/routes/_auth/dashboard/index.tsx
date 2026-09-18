import { createFileRoute } from '@tanstack/react-router';
import { DASHBOARD_PAGE_SIZE, DashboardPage } from '@/pages/dashboard/dashboard-page';
import { myPostsOptions } from '@/query-options/post-options';

export const Route = createFileRoute('/_auth/dashboard/')({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(myPostsOptions(0, DASHBOARD_PAGE_SIZE)),
  component: DashboardPage,
});
