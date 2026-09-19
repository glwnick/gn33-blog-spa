import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import type { Comment } from '@/schemas/comments';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AuthorAvatar } from '@/components/author-avatar';
import { HeaderAlert } from '@/components/header-alert';
import { COMMENT_KEY, commentsOptions } from '@/query-options/comment-options';
import { createComment } from '@/api/comments-api';
import { useAlertMutation } from '@/hooks/use-alert-mutation';
import { useAuth } from '@/context/auth-provider';
import { useTranslation } from '@/hooks/use-translation';
import { formatDate } from '@/lib/formatting';

function CommentRow({ comment }: { readonly comment: Comment }) {
  return (
    <div className="flex gap-3">
      <AuthorAvatar
        authorId={comment.author.id}
        profilePictureUrl={comment.author.profilePictureUrl}
        firstName={comment.author.firstName}
        lastName={comment.author.lastName}
        size="sm"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">
            {comment.author.firstName} {comment.author.lastName}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDate(comment.date)}
          </span>
        </div>
        <p className="mt-0.5 text-sm whitespace-pre-wrap text-foreground">
          {comment.text}
        </p>
      </div>
    </div>
  );
}

function CommentComposer({ postId }: { readonly postId: string }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [text, setText] = useState('');

  const { mutate, isPending, alertError, clearAlertError } = useAlertMutation({
    mutationFn: () => createComment(postId, { text }),
    onSuccess: async () => {
      setText('');
      await queryClient.invalidateQueries({ queryKey: [COMMENT_KEY, postId] });
    },
  });

  return (
    <div className="flex flex-col gap-2">
      <HeaderAlert error={alertError} />
      <Textarea
        value={text}
        onChange={(event) => {
          clearAlertError();
          setText(event.target.value);
        }}
        placeholder={t('commentPlaceholder')}
        rows={3}
      />
      <Button
        className="self-end"
        disabled={!text.trim() || isPending}
        onClick={() => mutate()}
      >
        {t('commentSubmit')}
      </Button>
    </div>
  );
}

export function CommentSection({ postId }: { readonly postId: string }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const { data: comments } = useSuspenseQuery(commentsOptions(postId));

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-sm font-medium">
        {t('commentCount', { count: comments.length })}
      </h2>

      <div className="flex flex-col gap-4">
        {comments.map((comment) => (
          <CommentRow key={comment.id} comment={comment} />
        ))}
      </div>

      {user ? (
        <CommentComposer postId={postId} />
      ) : (
        <p className="text-sm text-muted-foreground">
          <Link
            to="/login"
            search={{ redirect: location.href }}
            className="font-medium text-foreground underline underline-offset-2"
          >
            {t('login')}
          </Link>{' '}
          {t('commentLoginPromptSuffix')}
        </p>
      )}
    </section>
  );
}
