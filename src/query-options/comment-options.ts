import { queryOptions } from '@tanstack/react-query';
import { VOLATILE_STALE_TIME } from '@/config/query';
import { getComments } from '@/api/comments-api';

export const COMMENT_KEY = 'comments' as const;

export const commentsOptions = (postId: string) => {
  return queryOptions({
    queryKey: [COMMENT_KEY, postId],
    queryFn: () => getComments(postId),
    staleTime: VOLATILE_STALE_TIME,
  });
};
