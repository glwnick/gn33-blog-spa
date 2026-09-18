import { z } from 'zod';
import type { PaginationParams, SortParams } from '@/types/pageable';
import type { ProductStatus } from '@/schemas/products';
import {
  categoryRefSchema,
  productLegalClassificationSchema,
  productStatusSchema,
} from '@/schemas/products';
import { dateTimeSchema, requiredStringSchema } from '@/schemas/common';
import { filtersFor } from '@/types/pageable';

// --- Read side ---------------------------------------------------------------------------------------------------

export const adminProductSummarySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  status: productStatusSchema,
  featured: z.boolean(),
  variantCount: z.number().int(),
  totalStock: z.number().int(),
  minPrice: z.number().nullable(),
  primaryImageUrl: z.string().nullable(),
  updatedAt: dateTimeSchema,
  // Non-null only when variantCount is 1 - the inline stock control (shared with the variant-row form) needs a
  // real variant id to target, and a multi-variant product has no single variant the list could mean.
  soleVariantId: z.uuid().nullable(),
  // Batched by `AdminProductServiceImpl.listProducts` rather than read off the lazy `ProductEntity.categories`
  // per row - the list's Category column and its column filter.
  categories: z.array(categoryRefSchema),
});
export type AdminProductSummary = z.infer<typeof adminProductSummarySchema>;

export const adminProductVariantPriceHistorySchema = z.object({
  price: z.number(),
  effectiveFrom: dateTimeSchema,
});
export type AdminProductVariantPriceHistory = z.infer<
  typeof adminProductVariantPriceHistorySchema
>;

export const adminProductVariantDetailSchema = z.object({
  id: z.uuid(),
  sku: z.string(),
  // The id drives the form's size picker; the name rides along so a row renders without joining the size list.
  sizeId: z.uuid().nullable(),
  size: z.string().nullable(),
  yarnId: z.uuid().nullable(),
  colourName: z.string().nullable(),
  colourHex: z.string().nullable(),
  // Same reasoning as sizeId/size.
  materialId: z.uuid().nullable(),
  material: z.string().nullable(),
  price: z.number(),
  stock: z.number().int(),
  oneOfAKind: z.boolean(),
  permanentlyUnavailable: z.boolean(),
  productionBatchCode: z.string().nullable(),
  madeToOrder: z.boolean(),
  leadTimeDays: z.number().int().nullable(),
  displayOrder: z.number().int(),
  priceHistory: z.array(adminProductVariantPriceHistorySchema),
});
export type AdminProductVariantDetail = z.infer<
  typeof adminProductVariantDetailSchema
>;

export const adminProductImageSchema = z.object({
  id: z.uuid(),
  url: z.string(),
  altText: z.string(),
  primary: z.boolean(),
  displayOrder: z.number().int(),
  variantId: z.uuid().nullable(),
});
export type AdminProductImage = z.infer<typeof adminProductImageSchema>;

/** Every image id on the product, in the desired order; `primaryImageId: null` clears the primary flag from all of them. */
export const adminProductImageOrderInputSchema = z.object({
  imageIds: z.array(z.uuid()),
  primaryImageId: z.uuid().nullable(),
});
export type AdminProductImageOrderInput = z.infer<
  typeof adminProductImageOrderInputSchema
>;

export const adminProductDetailSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  makerNote: z.string().nullable(),
  status: productStatusSchema,
  featured: z.boolean(),
  seasonal: z.boolean(),
  legalClassification: productLegalClassificationSchema,
  manufacturerIdentity: z.string(),
  ceMarked: z.boolean(),
  fibreCompositionFilling: z.string().nullable(),
  careInstructions: z.string().nullable(),
  ageWarning: z.string().nullable(),
  safetyWarning: z.string().nullable(),
  dppIdentifier: z.string().nullable(),
  // Null until the product's first ACTIVE - what decision 7's slug freeze and decision 19's delete guard both
  // key off, in the form as much as on the backend: the "Remove" control below reads this to decide whether a
  // variant row can be deleted outright or must fall back to "mark unavailable" (conflict 2).
  firstPublishedAt: dateTimeSchema.nullable(),
  // The entity's own audit `lastModifiedDate`, for the edit form's "last saved" meta line - not customer-
  // reachable data, so exposing it here doesn't run into the raw-audit-DTO rule that public DTOs follow.
  updatedAt: dateTimeSchema,
  categories: z.array(categoryRefSchema),
  variants: z.array(adminProductVariantDetailSchema),
  images: z.array(adminProductImageSchema),
});
export type AdminProductDetail = z.infer<typeof adminProductDetailSchema>;

export const adminProductDefaultsSchema = z.object({
  manufacturerIdentity: z.string(),
});
export type AdminProductDefaults = z.infer<typeof adminProductDefaultsSchema>;

// --- List filters -------------------------------------------------------------------------------------------------

// Not derived from adminProductSummarySchema's shape the way userFiltersSchema is from userResponseSchema: the
// backend's AdminProductFilterDto has its own three fields (search, status, category), none of which line up
// 1:1 with the summary row (search covers name/slug/SKU; category is a slug, not one of the summary's fields
// at all). Runtime validation still goes through filtersFor for the shared pagination/sort handling.
export const adminProductFiltersSchema = filtersFor({
  search: z.string(),
  status: productStatusSchema,
  category: z.string(),
});

// Hand-typed, not `z.infer<typeof adminProductFiltersSchema>` - same reasoning as `UserListFilters`: the sort
// param's loose regex-validated string would widen `SortParams`'s branded `${string},asc|desc` type.
export type AdminProductListFilters = {
  search?: string;
  status?: ProductStatus;
  category?: string;
} & PaginationParams &
  SortParams;

// --- Write side ---------------------------------------------------------------------------------------------------

export const adminProductVariantInputSchema = z.object({
  // Null for a new row the maker just added; an existing row's real id otherwise. Matched against the saved
  // product's variants server-side (AdminProductServiceImpl's diff) - see product-variant-rows.tsx.
  id: z.uuid().nullable(),
  sku: requiredStringSchema,
  // The size record, not a copy of its name: it lives on the size since the V10 migration, so a rename on
  // /admin/library reaches every product at once instead of leaving stale strings behind.
  sizeId: z.uuid().nullable(),
  // The yarn record, not a copy of its name and swatch: those live on the yarn since the V9 migration, so a
  // rename on /admin/library reaches every product at once instead of leaving stale strings behind.
  yarnId: z.uuid().nullable(),
  // Same reasoning as sizeId.
  materialId: z.uuid().nullable(),
  price: z.number().positive('required'),
  // Only honoured by the backend for a brand-new row (id === null) - constraint 4, decision 16. Read-only in
  // the form for an existing row; its own stock-adjust-control is the only thing that ever changes it.
  stock: z.number().int().min(0),
  oneOfAKind: z.boolean(),
  permanentlyUnavailable: z.boolean(),
  productionBatchCode: z.string().nullable(),
  madeToOrder: z.boolean(),
  leadTimeDays: z.number().int().nullable(),
  displayOrder: z.number().int(),
});
export type AdminProductVariantInput = z.infer<
  typeof adminProductVariantInputSchema
>;

export const adminProductSaveInputSchema = z.object({
  name: requiredStringSchema,
  // Blank derives one from `name` server-side (SlugGenerator) - see product-form-page.tsx.
  slug: z.string(),
  description: requiredStringSchema,
  makerNote: z.string().nullable(),
  seasonal: z.boolean(),
  legalClassification: productLegalClassificationSchema,
  manufacturerIdentity: requiredStringSchema,
  ceMarked: z.boolean(),
  fibreCompositionFilling: z.string().nullable(),
  careInstructions: z.string().nullable(),
  ageWarning: z.string().nullable(),
  safetyWarning: z.string().nullable(),
  dppIdentifier: z.string().nullable(),
  categoryIds: z.array(z.uuid()),
  variants: z.array(adminProductVariantInputSchema),
});
export type AdminProductSaveInput = z.infer<typeof adminProductSaveInputSchema>;

export const adminProductStatusInputSchema = z.object({
  status: productStatusSchema,
});

export const adminProductFeaturedInputSchema = z.object({
  featured: z.boolean(),
});

export const adminStockAdjustmentInputSchema = z.object({
  stock: z.number().int().min(0, 'required'),
});
export type AdminStockAdjustmentInput = z.infer<
  typeof adminStockAdjustmentInputSchema
>;
