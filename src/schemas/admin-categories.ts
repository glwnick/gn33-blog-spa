import { z } from 'zod';

// Mirrors AdminCategoryResponseDto - every product regardless of status, unlike the public categorySchema in
// schemas/products.ts, which only counts ACTIVE ones.
export const adminCategorySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  displayOrder: z.number().int(),
  makingLeadTimeDays: z.number().int().nullable(),
  productCount: z.number().int(),
});
export type AdminCategory = z.infer<typeof adminCategorySchema>;

// Blank slug derives one from the name server-side - see AdminCategoryRequestDto.
export const adminCategoryFormSchema = z.object({
  name: z.string().min(1, 'required'),
  slug: z.string(),
});
export type AdminCategoryForm = z.infer<typeof adminCategoryFormSchema>;
