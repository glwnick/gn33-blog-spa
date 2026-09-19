import type { Page, PageResponse } from '@/types/pageable';
import type { AuthorProfile, PostDetail, PostSaveInput, PostSummary } from '@/schemas/posts';
import {
  authorProfileSchema,
  postDetailSchema,
  postSummarySchema,
} from '@/schemas/posts';
import API_ENDPOINTS from '@/config/api-endpoints';
import api from '@/lib/axios';

export const getFeed = async (
  authorId: string | undefined,
  page: number,
  size: number,
  query?: string,
): Promise<Page<PostSummary>> => {
  const res = await api.get<PageResponse<PostSummary>>(API_ENDPOINTS.posts.feed, {
    params: { authorId, q: query || undefined, page, size },
  });
  return {
    ...res.data.page,
    content: res.data.content.map((item) => postSummarySchema.parse(item)),
  };
};

export const getMyPosts = async (
  page: number,
  size: number,
  query?: string,
): Promise<Page<PostSummary>> => {
  const res = await api.get<PageResponse<PostSummary>>(API_ENDPOINTS.posts.mine, {
    params: { q: query || undefined, page, size },
  });
  return {
    ...res.data.page,
    content: res.data.content.map((item) => postSummarySchema.parse(item)),
  };
};

export const getPost = async (postId: string): Promise<PostDetail> => {
  const res = await api.get(API_ENDPOINTS.posts.detail(postId));
  return postDetailSchema.parse(res.data);
};

export const createPost = async (data: PostSaveInput): Promise<PostDetail> => {
  const res = await api.post(API_ENDPOINTS.posts.create, data);
  return postDetailSchema.parse(res.data);
};

export const updatePost = async (
  postId: string,
  data: PostSaveInput,
): Promise<PostDetail> => {
  const res = await api.put(API_ENDPOINTS.posts.update(postId), data);
  return postDetailSchema.parse(res.data);
};

export const deletePost = async (postId: string): Promise<void> => {
  await api.delete(API_ENDPOINTS.posts.delete(postId));
};

export const getAuthorProfile = async (
  authorId: string,
): Promise<AuthorProfile> => {
  const res = await api.get(API_ENDPOINTS.users.authorProfile(authorId));
  return authorProfileSchema.parse(res.data);
};
