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

/**
 * Mirrors the backend's `https://` rule for cover and gallery image URLs. A blank value is not a URL at all, so
 * callers decide separately whether blank is allowed (the cover is optional, a blank gallery row is dropped).
 */
export const isHttpsUrl = (value: string): boolean => {
  if (/\s/.test(value)) {
    return false;
  }
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
};

/** Site-relative path `PostImageController` returns after an upload; mirrors `GalleryImageDto.IMAGE_REF`. */
const UPLOADED_IMAGE_PATH = /^\/v1\/post-images\/[0-9a-f-]{36}\.(jpg|jpeg|png)$/;

/** A cover/gallery image is either a hotlinked https URL or an uploaded image's path. */
export const isImageRef = (value: string): boolean =>
  UPLOADED_IMAGE_PATH.test(value) || isHttpsUrl(value);

// Mirror the backend limits in PostServiceImpl / PostSaveRequestDto.
export const MAX_TAGS = 20;
export const MAX_TAG_LENGTH = 60;
export const MAX_TAGS_INPUT_LENGTH = 1000;
export const MAX_BODY_LENGTH = 50_000;

export type TagsProblem = 'tooMany' | 'tooLong' | 'inputTooLong';

/**
 * Applies the backend's tag rules to the raw comma-separated field: entries are trimmed and lowercased,
 * blanks dropped and duplicates collapsed before counting, exactly as `PostServiceImpl.resolveTags` does.
 */
export const findTagsProblem = (tagsInput: string): TagsProblem | null => {
  if (tagsInput.length > MAX_TAGS_INPUT_LENGTH) {
    return 'inputTooLong';
  }
  const names = new Set(
    tagsInput
      .split(',')
      .map((tag) => tag.trim().toLowerCase())
      .filter((tag) => tag !== ''),
  );
  if ([...names].some((name) => name.length > MAX_TAG_LENGTH)) {
    return 'tooLong';
  }
  return names.size > MAX_TAGS ? 'tooMany' : null;
};
