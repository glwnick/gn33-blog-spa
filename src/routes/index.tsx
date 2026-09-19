import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { FEED_PAGE_SIZE, FeedPage } from '@/pages/feed/feed-page';
import { feedOptions } from '@/query-options/post-options';

const feedSearchSchema = z.object({
  page: z.number().int().min(0).catch(0).default(0),
  // Mirrors the backend: a query under 2 characters is rejected there, so drop it here rather than 400 the loader.
  q: z
    .string()
    .trim()
    .max(100)
    .transform((value) => (value.length < 2 ? '' : value))
    .catch('')
    .default(''),
});

/**
 * The public feed at `/`, for every visitor, signed in or not. Deliberately outside `_auth`/`_no-auth`/
 * `terms`: it reads nothing from the session and prefetches in its loader so a crawler's first response
 * carries real post HTML.
 */
export const Route = createFileRoute('/')({
  validateSearch: feedSearchSchema,
  loaderDeps: ({ search }) => ({ page: search.page, q: search.q }),
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(
      feedOptions(undefined, deps.page, FEED_PAGE_SIZE, deps.q),
    ),
  component: () => {
    const { page, q } = Route.useSearch();
    return <FeedPage page={page} query={q} />;
  },
});
