import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { AnchorLink } from '@/components/anchor-link';
import { AlertDialogDestructive } from '@/components/alert-dialog-destructive';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { POST_KEY, postOptions } from '@/query-options/post-options';
import { deletePost } from '@/api/posts-api';
import { useTranslation } from '@/hooks/use-translation';

type PostActionsProps = {
  readonly postId: string;
  readonly title: string;
  /** Hide the view button on the post's own page. */
  readonly showView?: boolean;
  /** Runs after the post is gone; a page showing the post must leave it here. */
  readonly onDeleted?: () => void | Promise<void>;
};

/** View / edit / delete icon buttons for a post the signed-in user authored. */
export function PostActions({
  postId,
  title,
  showView = true,
  onDeleted,
}: PostActionsProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // A mutation, not a bare call: query-client's MutationCache turns a failure into a toast.
  const { mutate: removePost } = useMutation({
    mutationFn: () => deletePost(postId),
    onSuccess: async () => {
      // Refetching this post's own query 404s, and the page still showing it would throw - so leave first.
      await queryClient.invalidateQueries({
        queryKey: [POST_KEY],
        predicate: (query) => query.queryKey[1] !== postId,
      });
      await onDeleted?.();
      queryClient.removeQueries({ queryKey: postOptions(postId).queryKey });
    },
  });

  return (
    <div className="flex shrink-0 items-center gap-0.5">
      {showView && (
        <Tooltip>
          <TooltipTrigger
            render={
              <AnchorLink
                to="/posts/$postId"
                params={{ postId }}
                aria-label={t('dashboardView')}
                className={buttonVariants({ variant: 'ghost', size: 'icon' })}
              >
                <Eye className="size-4" />
              </AnchorLink>
            }
          />
          <TooltipContent>{t('dashboardView')}</TooltipContent>
        </Tooltip>
      )}
      <Tooltip>
        <TooltipTrigger
          render={
            <AnchorLink
              to="/write/$postId"
              params={{ postId }}
              aria-label={t('dashboardEdit')}
              className={buttonVariants({ variant: 'ghost', size: 'icon' })}
            >
              <Pencil className="size-4" />
            </AnchorLink>
          }
        />
        <TooltipContent>{t('dashboardEdit')}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <AlertDialogDestructive
          triggerButton={
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t('dashboardDelete')}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
              }
            />
          }
          title={t('dashboardDeleteConfirmTitle')}
          description={t('dashboardDeleteConfirmDescription', { title })}
          action={() => {
            removePost();
          }}
        />
        <TooltipContent>{t('dashboardDelete')}</TooltipContent>
      </Tooltip>
    </div>
  );
}
