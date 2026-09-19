import { useSuspenseQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { AppContent } from '@/components/layout/app-content';
import { buttonVariants } from '@/components/ui/button';
import { AnchorLink } from '@/components/anchor-link';
import { SearchForm } from '@/components/search-form';
import { PostActions } from '@/pages/posts/post-actions';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { myPostsOptions } from '@/query-options/post-options';
import { useTranslation } from '@/hooks/use-translation';
import { formatDate } from '@/lib/formatting';
import { cn } from '@/lib/utils';

export const DASHBOARD_PAGE_SIZE = 50;

type DashboardPageProps = {
  readonly query: string;
};

export function DashboardPage({ query }: DashboardPageProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: posts } = useSuspenseQuery(
    myPostsOptions(0, DASHBOARD_PAGE_SIZE, query),
  );

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
      {(query || posts.content.length > 0) && (
        <SearchForm
          query={query}
          placeholder={t('dashboardSearchPlaceholder')}
          onSearch={(next) =>
            navigate({ to: '.', search: { q: next || undefined } })
          }
        />
      )}
      {posts.content.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>
              {query
                ? t('searchEmptyTitle', { query })
                : t('dashboardEmptyTitle')}
            </EmptyTitle>
            <EmptyDescription>
              {query
                ? t('searchEmptyDescription')
                : t('dashboardEmptyDescription')}
            </EmptyDescription>
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
              <PostActions postId={post.id} title={post.title} />
            </div>
          ))}
        </div>
      )}
    </AppContent>
  );
}
