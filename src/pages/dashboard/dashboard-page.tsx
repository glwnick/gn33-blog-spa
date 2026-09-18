import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { AppContent } from '@/components/layout/app-content';
import { Button, buttonVariants } from '@/components/ui/button';
import { AnchorLink } from '@/components/anchor-link';
import { AlertDialogDestructive } from '@/components/alert-dialog-destructive';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { POST_KEY, myPostsOptions } from '@/query-options/post-options';
import { deletePost } from '@/api/posts-api';
import { useTranslation } from '@/hooks/use-translation';
import { formatDate } from '@/lib/formatting';
import { cn } from '@/lib/utils';

export const DASHBOARD_PAGE_SIZE = 50;

export function DashboardPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: posts } = useSuspenseQuery(
    myPostsOptions(0, DASHBOARD_PAGE_SIZE),
  );

  const handleDelete = async (postId: string) => {
    await deletePost(postId);
    await queryClient.invalidateQueries({ queryKey: [POST_KEY] });
  };

  return (
    <AppContent
      title={
        <div className="flex items-center justify-between">
          <h1 className="truncate text-xl font-semibold tracking-tight">
            {t('dashboard')}
          </h1>
          <AnchorLink
            to="/write"
            className={cn(buttonVariants({ variant: 'default' }), 'gap-1.5')}
          >
            <Plus className="size-4" />
            {t('newPost')}
          </AnchorLink>
        </div>
      }
    >
      {posts.content.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>{t('dashboardEmptyTitle')}</EmptyTitle>
            <EmptyDescription>{t('dashboardEmptyDescription')}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col divide-y">
          {posts.content.map((post) => (
            <div
              key={post.id}
              className="flex items-center justify-between gap-3 py-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{post.title}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(post.date)} · {t('readTimeMinutes', { count: post.readTimeMinutes })}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Link
                  to="/posts/$postId"
                  params={{ postId: post.id }}
                  className={buttonVariants({ variant: 'ghost', size: 'sm' })}
                >
                  {t('dashboardView')}
                </Link>
                <AnchorLink
                  to="/write/$postId"
                  params={{ postId: post.id }}
                  className={buttonVariants({ variant: 'ghost', size: 'sm' })}
                >
                  {t('dashboardEdit')}
                </AnchorLink>
                <AlertDialogDestructive
                  triggerButton={
                    <Button variant="ghost" size="sm">
                      {t('dashboardDelete')}
                    </Button>
                  }
                  title={t('dashboardDeleteConfirmTitle')}
                  description={t('dashboardDeleteConfirmDescription', {
                    title: post.title,
                  })}
                  action={() => void handleDelete(post.id)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </AppContent>
  );
}
