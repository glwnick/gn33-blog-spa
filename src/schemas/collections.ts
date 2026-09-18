import { z } from 'zod';

export const collectionTypeSchema = z.object({
  key: z.string(),
  messageKey: z.string(),
  localizedMessage: z.string(),
});

export type CollectionType = z.infer<typeof collectionTypeSchema>;
