import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { DASHBOARD_PAGE_SIZE, DashboardPage } from '@/pages/dashboard/dashboard-page';
import { myPostsOptions } from '@/query-options/post-options';
import { searchQuerySchema } from '@/schemas/search-query';

const dashboardSearchSchema = z.object({
  q: searchQuerySchema,
});

export const Route = createFileRoute('/_auth/dashboard/')({
  validateSearch: dashboardSearchSchema,
  loaderDeps: ({ search }) => ({ q: search.q }),
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(
      myPostsOptions(0, DASHBOARD_PAGE_SIZE, deps.q),
    ),
  component: () => {
    const { q } = Route.useSearch();
    return <DashboardPage query={q} />;
  },
});
