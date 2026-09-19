import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { searchQuerySchema } from '@/schemas/search-query';
import { FEED_PAGE_SIZE, FeedPage } from '@/pages/feed/feed-page';
import { feedOptions } from '@/query-options/post-options';

const feedSearchSchema = z.object({
  page: z.number().int().min(0).catch(0).default(0),
  q: searchQuerySchema,
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
