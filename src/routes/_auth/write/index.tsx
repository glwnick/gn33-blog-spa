import { createFileRoute } from '@tanstack/react-router';
import { PostEditorPage } from '@/pages/write/post-editor-page';

export const Route = createFileRoute('/_auth/write/')({
  component: () => <PostEditorPage />,
});
