import { z } from 'zod';
import { dateTimeSchema, requiredStringSchema } from '@/schemas/common';
import { authorSummarySchema } from '@/schemas/posts';

export const commentSchema = z.object({
  id: z.uuid(),
  author: authorSummarySchema,
  date: dateTimeSchema,
  text: z.string(),
});

export type Comment = z.infer<typeof commentSchema>;

export const commentInputSchema = z.object({
  text: requiredStringSchema.max(5000),
});

export type CommentInput = z.infer<typeof commentInputSchema>;
