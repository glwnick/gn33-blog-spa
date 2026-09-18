import { z } from 'zod';
import { dateTimeSchema, requiredStringSchema } from '@/schemas/common';

export const authorSummarySchema = z.object({
  id: z.uuid(),
  firstName: z.string(),
  lastName: z.string(),
  profilePictureUrl: z.string().nullable(),
});

export type AuthorSummary = z.infer<typeof authorSummarySchema>;

export const authorProfileSchema = z.object({
  id: z.uuid(),
  firstName: z.string(),
  lastName: z.string(),
  bio: z.string().nullable(),
  profilePictureUrl: z.string().nullable(),
});

export type AuthorProfile = z.infer<typeof authorProfileSchema>;

export const galleryImageSchema = z.object({
  imageUrl: requiredStringSchema.max(500),
  caption: z.string().max(500).nullable(),
});

export type GalleryImage = z.infer<typeof galleryImageSchema>;

/** The feed/dashboard/author-profile card projection - mirrors backend `PostSummaryResponseDto`. */
export const postSummarySchema = z.object({
  id: z.uuid(),
  title: z.string(),
  excerpt: z.string(),
  coverImageUrl: z.string().nullable(),
  author: authorSummarySchema,
  date: dateTimeSchema,
  readTimeMinutes: z.number().int(),
  tags: z.array(z.string()),
});

export type PostSummary = z.infer<typeof postSummarySchema>;

/** The post detail read - mirrors backend `PostDetailResponseDto`. */
export const postDetailSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  bodyMarkdown: z.string(),
  coverImageUrl: z.string().nullable(),
  author: authorSummarySchema,
  date: dateTimeSchema,
  readTimeMinutes: z.number().int(),
  tags: z.array(z.string()),
  gallery: z.array(galleryImageSchema),
  commentCount: z.number().int(),
});

export type PostDetail = z.infer<typeof postDetailSchema>;

/**
 * Create/update payload. `excerpt` left blank is auto-derived from `bodyMarkdown` by the backend, so the
 * editor's excerpt field is optional. `tagsInput` is the editor's raw comma-separated tag field - the backend
 * splits/normalizes/find-or-creates the actual `TagEntity` rows from it.
 */
export const postSaveInputSchema = z.object({
  title: requiredStringSchema.max(200),
  excerpt: z.string().max(500).nullable(),
  bodyMarkdown: requiredStringSchema,
  coverImageUrl: z.string().max(500).nullable(),
  tagsInput: z.string(),
  gallery: z.array(galleryImageSchema),
});

export type PostSaveInput = z.infer<typeof postSaveInputSchema>;

export const emptyPostSaveInput: PostSaveInput = {
  title: '',
  excerpt: null,
  bodyMarkdown: '',
  coverImageUrl: null,
  tagsInput: '',
  gallery: [],
};
