import { createFileRoute } from '@tanstack/react-router';
import { PostDetailPage } from '@/pages/posts/post-detail-page';
import { postOptions } from '@/query-options/post-options';
import { commentsOptions } from '@/query-options/comment-options';

/** Public: an anonymous visitor can read any post and its comments (`SecurityConfig.PUBLIC_GET_PATHS`). */
export const Route = createFileRoute('/posts/$postId')({
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(postOptions(params.postId)),
      context.queryClient.ensureQueryData(commentsOptions(params.postId)),
    ]),
  component: () => {
    const { postId } = Route.useParams();
    return <PostDetailPage postId={postId} />;
  },
});
