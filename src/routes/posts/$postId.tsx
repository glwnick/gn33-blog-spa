import { createFileRoute } from '@tanstack/react-router';
import { PostDetailPage } from '@/pages/posts/post-detail-page';
import { postOptions } from '@/query-options/post-options';
import { commentsOptions } from '@/query-options/comment-options';
import { buildPostHead } from '@/lib/post-share';

/** Public: an anonymous visitor can read any post and its comments (`SecurityConfig.PUBLIC_GET_PATHS`). */
export const Route = createFileRoute('/posts/$postId')({
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(postOptions(params.postId)),
      context.queryClient.ensureQueryData(commentsOptions(params.postId)),
    ]),
  // Post-specific title/OG/canonical, layered over the site-wide tags in `__root.tsx`, so a shared link previews as
  // this post rather than as the blog's home page.
  head: ({ loaderData }) => {
    const post = loaderData?.[0];
    return post ? buildPostHead(post) : {};
  },
  component: () => {
    const { postId } = Route.useParams();
    return <PostDetailPage postId={postId} />;
  },
});
