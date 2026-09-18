import { createFileRoute } from '@tanstack/react-router';
import { PostEditorPage } from '@/pages/write/post-editor-page';
import { postOptions } from '@/query-options/post-options';

/** Loads the post publicly (`/v1/posts/{postId}` is a public GET); only the actual save attempt is
 * ownership-checked, server-side, by `PostServiceImpl.loadOwnedPost` - a 403 there surfaces through this
 * page's own `HeaderAlert` rather than being pre-empted by a client-side guard. */
export const Route = createFileRoute('/_auth/write/$postId')({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(postOptions(params.postId)),
  component: () => {
    const post = Route.useLoaderData();
    return <PostEditorPage post={post} />;
  },
});
