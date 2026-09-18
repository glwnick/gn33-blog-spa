import { createFileRoute } from '@tanstack/react-router';
import { AUTHOR_POSTS_PAGE_SIZE, AuthorProfilePage } from '@/pages/authors/author-profile-page';
import { authorProfileOptions, feedOptions } from '@/query-options/post-options';

/** Public: the author-profile read and the author-filtered feed read are both in
 * `SecurityConfig.PUBLIC_GET_PATHS`. */
export const Route = createFileRoute('/authors/$authorId')({
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(authorProfileOptions(params.authorId)),
      context.queryClient.ensureQueryData(
        feedOptions(params.authorId, 0, AUTHOR_POSTS_PAGE_SIZE),
      ),
    ]),
  component: () => {
    const { authorId } = Route.useParams();
    return <AuthorProfilePage authorId={authorId} />;
  },
});
