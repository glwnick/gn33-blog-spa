import { Suspense } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Markdown } from '@/components/ui/markdown';
import { ZoomableImage } from '@/components/zoomable-image';
import { AuthorAvatar } from '@/components/author-avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { CommentSection } from '@/pages/posts/comment-list';
import { postOptions } from '@/query-options/post-options';
import { useTranslation } from '@/hooks/use-translation';
import { formatDate } from '@/lib/formatting';
import { resolveImageUrl } from '@/lib/image-url';

type PostDetailPageProps = {
  readonly postId: string;
};

export function PostDetailPage({ postId }: PostDetailPageProps) {
  const { t } = useTranslation();
  const { data: post } = useSuspenseQuery(postOptions(postId));

  return (
    <main className="mx-auto w-full max-w-3xl px-3 py-4 md:px-4 md:py-6">
      <Link
        to="/"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {t('backToFeed')}
      </Link>

      <article className="flex flex-col gap-4">
        {post.tags.length > 0 && (
          <Badge variant="accent" className="w-fit">
            {post.tags[0]}
          </Badge>
        )}

        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {post.title}
        </h1>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link
            to="/authors/$authorId"
            params={{ authorId: post.author.id }}
            className="flex items-center gap-2 hover:text-foreground"
          >
            <AuthorAvatar
              firstName={post.author.firstName}
              lastName={post.author.lastName}
              size="sm"
            />
            <span className="font-medium text-foreground">
              {post.author.firstName} {post.author.lastName}
            </span>
          </Link>
          <span aria-hidden="true">·</span>
          <span>{formatDate(post.date)}</span>
          <span aria-hidden="true">·</span>
          <span>{t('readTimeMinutes', { count: post.readTimeMinutes })}</span>
        </div>

        {post.coverImageUrl && (
          <ZoomableImage
            src={resolveImageUrl(post.coverImageUrl)}
            alt=""
            className="aspect-video w-full rounded-xl object-cover"
          />
        )}

        <Markdown className="text-base leading-relaxed">
          {post.bodyMarkdown}
        </Markdown>

        {post.gallery.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-medium">{t('galleryTitle')}</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {post.gallery.map((image, index) => (
                <figure key={index} className="flex flex-col gap-1.5">
                  <ZoomableImage
                    src={resolveImageUrl(image.imageUrl)}
                    alt={image.caption ?? ''}
                    className="aspect-square w-full rounded-lg object-cover"
                  />
                  {image.caption && (
                    <figcaption className="text-xs text-muted-foreground">
                      {image.caption}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          </section>
        )}

        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </article>

      <div className="my-8 border-t" />

      <Suspense fallback={<Skeleton className="h-32 w-full" />}>
        <CommentSection postId={postId} />
      </Suspense>
    </main>
  );
}
