import { z } from 'zod';
import { requiredStringSchema } from '@/schemas/common';

/**
 * A size as `/admin/library` manages it, modelled on `adminYarnSchema`. `productCount` counts products of every
 * status, matching the backend's delete guard - a DRAFT product using a size blocks its deletion just as an
 * ACTIVE one does.
 */
export const adminSizeSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  displayOrder: z.number().int(),
  discontinued: z.boolean(),
  productCount: z.number().int(),
});
export type AdminSize = z.infer<typeof adminSizeSchema>;

export const adminSizeInputSchema = z.object({
  name: requiredStringSchema,
  discontinued: z.boolean(),
});
export type AdminSizeInput = z.infer<typeof adminSizeInputSchema>;
