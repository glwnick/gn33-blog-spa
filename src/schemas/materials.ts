import { z } from 'zod';
import { requiredStringSchema } from '@/schemas/common';

/**
 * A material as `/admin/library` manages it, modelled on `adminYarnSchema`. Distinct from the yarn's own
 * `fibreComposition`: this is the shopper-facing filter for what a piece is made of overall, not the EU
 * 1007/2011 textile disclosure. `productCount` counts products of every status, matching the backend's delete
 * guard - a DRAFT product using a material blocks its deletion just as an ACTIVE one does.
 */
export const adminMaterialSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  displayOrder: z.number().int(),
  discontinued: z.boolean(),
  productCount: z.number().int(),
});
export type AdminMaterial = z.infer<typeof adminMaterialSchema>;

export const adminMaterialInputSchema = z.object({
  name: requiredStringSchema,
  discontinued: z.boolean(),
});
export type AdminMaterialInput = z.infer<typeof adminMaterialInputSchema>;
