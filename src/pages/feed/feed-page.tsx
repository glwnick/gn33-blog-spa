import { useState } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { AppContent } from '@/components/layout/app-content';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { PostCard } from '@/pages/feed/post-card';
import { feedOptions } from '@/query-options/post-options';
import { useTranslation } from '@/hooks/use-translation';

export const FEED_PAGE_SIZE = 12;

type FeedPageProps = {
  readonly page: number;
  readonly query: string;
};

export function FeedPage({ page, query }: FeedPageProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: feed } = useSuspenseQuery(
    feedOptions(undefined, page, FEED_PAGE_SIZE, query),
  );
  const goTo = (nextPage: number, nextQuery: string) =>
    navigate({
      to: '.',
      // Omit defaults so the bare feed keeps its canonical `/` URL.
      search: { page: nextPage || undefined, q: nextQuery || undefined },
    });

  return (
    <AppContent
      title={
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t('feedMasthead')}
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            {t('feedTagline')}
          </p>
        </div>
      }
    >
      <FeedSearchForm
        key={query}
        query={query}
        onSearch={(next) => goTo(0, next)}
      />

      {feed.content.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>
              {query
                ? t('feedSearchEmptyTitle', { query })
                : t('feedEmptyTitle')}
            </EmptyTitle>
            <EmptyDescription>
              {query
                ? t('feedSearchEmptyDescription')
                : t('feedEmptyDescription')}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {feed.content.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>

          {feed.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => goTo(page - 1, query)}
              >
                {t('pagePrevious')}
              </Button>
              <span className="text-sm text-muted-foreground">
                {t('pageOfTotal', { page: page + 1, total: feed.totalPages })}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page + 1 >= feed.totalPages}
                onClick={() => goTo(page + 1, query)}
              >
                {t('pageNext')}
              </Button>
            </div>
          )}
        </>
      )}
    </AppContent>
  );
}

type FeedSearchFormProps = {
  readonly query: string;
  readonly onSearch: (query: string) => void;
};

/**
 * Keyed on the URL's query by its parent, so back/forward or Clear remounts it with the new text instead of
 * this component mirroring the URL into state.
 */
function FeedSearchForm({ query, onSearch }: FeedSearchFormProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(query);

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch(draft.trim());
      }}
      className="mb-6 flex max-w-xl items-center gap-2"
    >
      <Input
        type="search"
        value={draft}
        maxLength={100}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={t('feedSearchPlaceholder')}
        aria-label={t('search')}
      />
      <Button
        type="submit"
        size="sm"
        disabled={draft.trim().length === 1}
      >
        {t('search')}
      </Button>
      {query && (
        <Button type="button" variant="ghost" size="sm" onClick={() => onSearch('')}>
          {t('feedSearchClear')}
        </Button>
      )}
    </form>
  );
}
