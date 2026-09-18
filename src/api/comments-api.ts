import type { Comment, CommentInput } from '@/schemas/comments';
import { commentSchema } from '@/schemas/comments';
import API_ENDPOINTS from '@/config/api-endpoints';
import api from '@/lib/axios';

export const getComments = async (postId: string): Promise<Array<Comment>> => {
  const res = await api.get<Array<unknown>>(API_ENDPOINTS.comments.list(postId));
  return res.data.map((item) => commentSchema.parse(item));
};

export const createComment = async (
  postId: string,
  data: CommentInput,
): Promise<Comment> => {
  const res = await api.post(API_ENDPOINTS.comments.create(postId), data);
  return commentSchema.parse(res.data);
};
