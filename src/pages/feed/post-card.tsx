import { Link } from '@tanstack/react-router';
import type { PostSummary } from '@/schemas/posts';
import { Badge } from '@/components/ui/badge';
import { AuthorAvatar } from '@/components/author-avatar';
import { useTranslation } from '@/hooks/use-translation';
import { formatDate } from '@/lib/formatting';
import { resolveImageUrl } from '@/lib/image-url';

type PostCardProps = {
  readonly post: PostSummary;
};

export function PostCard({ post }: PostCardProps) {
  const { t } = useTranslation();

  return (
    <Link
      to="/posts/$postId"
      params={{ postId: post.id }}
      className="group flex flex-col overflow-hidden rounded-xl border transition-colors hover:border-foreground/30"
    >
      <div className="aspect-video w-full overflow-hidden bg-muted">
        {post.coverImageUrl && (
          <img
            src={resolveImageUrl(post.coverImageUrl)}
            alt=""
            className="size-full object-cover transition-transform group-hover:scale-105"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        {post.tags.length > 0 && (
          <Badge variant="accent" className="w-fit">
            {post.tags[0]}
          </Badge>
        )}
        <h2 className="line-clamp-2 text-lg font-semibold tracking-tight">
          {post.title}
        </h2>
        <p className="line-clamp-2 flex-1 text-sm text-muted-foreground">
          {post.excerpt}
        </p>
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <AuthorAvatar
            firstName={post.author.firstName}
            lastName={post.author.lastName}
            size="sm"
          />
          <span className="truncate">
            {post.author.firstName} {post.author.lastName}
          </span>
          <span aria-hidden="true">·</span>
          <span className="shrink-0">{formatDate(post.date)}</span>
          <span aria-hidden="true">·</span>
          <span className="shrink-0">
            {t('readTimeMinutes', { count: post.readTimeMinutes })}
          </span>
        </div>
      </div>
    </Link>
  );
}
