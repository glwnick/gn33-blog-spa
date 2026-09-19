import { useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { AuthorAvatar } from '@/components/author-avatar';
import { AppContent } from '@/components/layout/app-content';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { authorProfileOptions, feedOptions } from '@/query-options/post-options';
import { useTranslation } from '@/hooks/use-translation';
import { formatDate } from '@/lib/formatting';

export const AUTHOR_POSTS_PAGE_SIZE = 20;

type AuthorProfilePageProps = {
  readonly authorId: string;
};

export function AuthorProfilePage({ authorId }: AuthorProfilePageProps) {
  const { t } = useTranslation();
  const { data: author } = useSuspenseQuery(authorProfileOptions(authorId));
  const { data: posts } = useSuspenseQuery(
    feedOptions(authorId, 0, AUTHOR_POSTS_PAGE_SIZE),
  );

  return (
    <AppContent
      title={
        <div className="flex items-center gap-3">
          <AuthorAvatar
            authorId={author.id}
            profilePictureUrl={author.profilePictureUrl}
            firstName={author.firstName}
            lastName={author.lastName}
            size="lg"
          />
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              {author.firstName} {author.lastName}
            </h1>
            {author.bio && (
              <p className="text-sm text-muted-foreground">{author.bio}</p>
            )}
          </div>
        </div>
      }
    >
      {posts.content.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>{t('authorNoPostsTitle')}</EmptyTitle>
            <EmptyDescription>{t('authorNoPostsDescription')}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col divide-y">
          {posts.content.map((post) => (
            <Link
              key={post.id}
              to="/posts/$postId"
              params={{ postId: post.id }}
              className="flex flex-col gap-0.5 py-3 hover:text-foreground"
            >
              <span className="font-medium">{post.title}</span>
              <span className="text-xs text-muted-foreground">
                {formatDate(post.date)} · {t('readTimeMinutes', { count: post.readTimeMinutes })}
              </span>
            </Link>
          ))}
        </div>
      )}
    </AppContent>
  );
}
