import { z } from 'zod';
import { dateTimeSchema, requiredStringSchema } from '@/schemas/common';

export const legalDocumentTypeSchema = z.enum(['TERMS', 'GDPR']);

export type LegalDocumentType = z.infer<typeof legalDocumentTypeSchema>;

export const legalDocumentResponseSchema = z.object({
  id: z.uuid(),
  type: legalDocumentTypeSchema,
  version: z.number().int(),
  content: z.string(),
  publishedAt: dateTimeSchema.nullable(),
  publishedBy: z.string().nullable(),
});

export type LegalDocumentResponse = z.infer<typeof legalDocumentResponseSchema>;

export const legalDocumentVersionSchema = z.object({
  id: z.uuid(),
  type: legalDocumentTypeSchema,
  version: z.number().int(),
  publishedAt: dateTimeSchema.nullable(),
  publishedBy: z.string().nullable(),
});

export type LegalDocumentVersion = z.infer<typeof legalDocumentVersionSchema>;

export const publishLegalDocumentSchema = z.object({
  content: requiredStringSchema,
});

export type PublishLegalDocumentInput = z.infer<
  typeof publishLegalDocumentSchema
>;
