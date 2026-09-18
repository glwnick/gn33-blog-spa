import { z } from 'zod';
import { requiredStringSchema } from '@/schemas/common';

/**
 * A yarn as `/admin/yarns` manages it. Staff-only: `supplier` and `notes` are the maker's own and never reach a
 * customer-facing projection - the storefront sees a yarn's name, swatch and fibre composition through the
 * products knitted from it (`productVariantSchema.colourName`/`colourHex`/`fibreComposition`), never this shape.
 *
 * `productCount` counts products of every status, matching the backend's delete guard: a DRAFT product using a
 * yarn blocks its deletion just as an ACTIVE one does, so a count that ignored drafts would contradict the
 * refusal the maker gets.
 */
export const adminYarnSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  hex: z.string().nullable(),
  fibreComposition: z.string().nullable(),
  supplier: z.string().nullable(),
  notes: z.string().nullable(),
  displayOrder: z.number().int(),
  discontinued: z.boolean(),
  productCount: z.number().int(),
});
export type AdminYarn = z.infer<typeof adminYarnSchema>;

/**
 * `hex` allows blank as well as `#RRGGBB`, matching the backend's own pattern: clearing the swatch field in a
 * form yields `''`, not null, and rejecting that would make an optional field impossible to unset.
 */
export const adminYarnInputSchema = z.object({
  name: requiredStringSchema,
  hex: z
    .string()
    .regex(/^$|^#[0-9a-fA-F]{6}$/, 'adminYarnHexInvalid')
    .nullable(),
  fibreComposition: z.string().nullable(),
  supplier: z.string().nullable(),
  notes: z.string().nullable(),
  discontinued: z.boolean(),
});
export type AdminYarnInput = z.infer<typeof adminYarnInputSchema>;
