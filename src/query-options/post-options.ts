import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { DEFAULT_STALE_TIME } from '@/config/query';
import {
  getAuthorProfile,
  getFeed,
  getMyPosts,
  getPost,
} from '@/api/posts-api';

export const POST_KEY = 'posts' as const;

export const feedOptions = (
  authorId: string | undefined,
  page: number,
  size: number,
  query?: string,
) => {
  return queryOptions({
    queryKey: [POST_KEY, 'feed', authorId, page, size, query ?? ''],
    queryFn: () => getFeed(authorId, page, size, query),
    placeholderData: keepPreviousData,
    staleTime: DEFAULT_STALE_TIME,
  });
};

export const myPostsOptions = (page: number, size: number, query?: string) => {
  return queryOptions({
    queryKey: [POST_KEY, 'mine', page, size, query ?? ''],
    queryFn: () => getMyPosts(page, size, query),
    placeholderData: keepPreviousData,
    staleTime: DEFAULT_STALE_TIME,
  });
};

export const postOptions = (postId: string) => {
  return queryOptions({
    queryKey: [POST_KEY, postId],
    queryFn: () => getPost(postId),
    staleTime: DEFAULT_STALE_TIME,
  });
};

export const authorProfileOptions = (authorId: string) => {
  return queryOptions({
    queryKey: ['authors', authorId],
    queryFn: () => getAuthorProfile(authorId),
    staleTime: DEFAULT_STALE_TIME,
  });
};
