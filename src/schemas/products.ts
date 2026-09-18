import { z } from 'zod';

export const productLegalClassificationSchema = z.enum(['TOY', 'NOT_TOY']);
export type ProductLegalClassification = z.infer<
  typeof productLegalClassificationSchema
>;

// Only ever ACTIVE for a non-staff caller - see plans/PLAN-catalogue-admin.md conflict 3. The other two values
// only ever reach the SPA through the staff draft preview at /shop/$slug.
export const productStatusSchema = z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']);
export type ProductStatus = z.infer<typeof productStatusSchema>;

export const productBadgeSchema = z.enum([
  'LAST_ONE',
  'SEASONAL',
  'READY_TO_SHIP',
  'TO_ORDER',
]);
export type ProductBadge = z.infer<typeof productBadgeSchema>;

// Deliberately absent: BESTSELLERS. No sales data exists yet to rank by - see plans/PLAN-shop-surfaces.md
// slice 1's cross-cutting notes, and the matching backend comment on ProductSortOption.
//
// DEFAULT groups the catalogue by the maker's own category display order - the backend's own no-sort default
// (ProductSortOption.DEFAULT in ProductQueryBuilder), now also a real, explicitly selectable choice here rather
// than only what an absent `sort` resolves to. Sent to the backend exactly like the other three; nothing special
// about it on the wire.
export const productSortSchema = z.enum(['DEFAULT', 'NEWEST', 'PRICE_ASC', 'PRICE_DESC']);
export type ProductSort = z.infer<typeof productSortSchema>;

export const colourSwatchSchema = z.object({
  name: z.string(),
  hex: z.string().nullable(),
});
export type ColourSwatch = z.infer<typeof colourSwatchSchema>;

// What the filter rail can actually offer, read from the catalogue rather than hardcoded. The rail used to
// carry a fixed four-colour brand palette and a fixed 0-250 price range, both copied from the design handoff:
// `colourName` is free text on the admin variant form, so any colour the maker added was unfilterable and any
// colour they renamed left a chip that always returned nothing, and a piece priced above 250 RON could never be
// bracketed. `minPrice`/`maxPrice` are null on an empty catalogue - see the backend's `CatalogueFacetsDto`.
export const colourFacetSchema = z.object({
  name: z.string(),
  hex: z.string().nullable(),
  productCount: z.number(),
});
export type ColourFacet = z.infer<typeof colourFacetSchema>;

// Shared by the size and material facets below - unlike colour, neither carries a swatch.
export const facetValueSchema = z.object({
  name: z.string(),
  productCount: z.number(),
});
export type FacetValue = z.infer<typeof facetValueSchema>;

export const catalogueFacetsSchema = z.object({
  colours: z.array(colourFacetSchema),
  sizes: z.array(facetValueSchema),
  materials: z.array(facetValueSchema),
  minPrice: z.number().nullable(),
  maxPrice: z.number().nullable(),
});
export type CatalogueFacets = z.infer<typeof catalogueFacetsSchema>;

export const categorySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  productCount: z.number(),
  // Slice 7's settings screen: how many days a made-to-order item in this category typically takes. Null
  // until a staff member sets it - see `category-lead-time-card.tsx`.
  makingLeadTimeDays: z.number().int().nullable(),
});
export type Category = z.infer<typeof categorySchema>;

export const categoryRefSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
});
export type CategoryRef = z.infer<typeof categoryRefSchema>;

export const productSummarySchema = z.object({
  id: z.uuid(),
  slug: z.string(),
  name: z.string(),
  imageUrl: z.string().nullable(),
  imageAltText: z.string().nullable(),
  price: z.number().nullable(),
  colours: z.array(colourSwatchSchema),
  // The card's meta line, per the handoff's "Organic cotton · 3 sizes". Two fields rather than one rendered
  // string because the size half needs pluralising in the shopper's language - see the backend DTO.
  fibreComposition: z.string().nullable(),
  sizes: z.array(z.string()),
  badge: productBadgeSchema.nullable(),
  // Always false for an anonymous caller - see the backend's ProductServiceImpl.
  favorited: z.boolean(),
});
export type ProductSummary = z.infer<typeof productSummarySchema>;

export const productVariantSchema = z.object({
  id: z.uuid(),
  sku: z.string(),
  size: z.string().nullable(),
  // All three come from the variant's yarn record rather than the variant itself - see the backend's V9
  // migration. `fibreComposition` is per-variant because a design offered in two yarns has two compositions;
  // `productDetailSchema.fibreCompositionYarn` is the distinct set of them, joined for the disclosure block.
  colourName: z.string().nullable(),
  colourHex: z.string().nullable(),
  fibreComposition: z.string().nullable(),
  material: z.string().nullable(),
  price: z.number(),
  available: z.boolean(),
  oneOfAKind: z.boolean(),
  madeToOrder: z.boolean(),
  leadTimeDays: z.number().nullable(),
});
export type ProductVariant = z.infer<typeof productVariantSchema>;

export const productImageSchema = z.object({
  url: z.string(),
  altText: z.string(),
  primary: z.boolean(),
  variantId: z.uuid().nullable(),
});
export type ProductImage = z.infer<typeof productImageSchema>;

export const productDetailSchema = z.object({
  id: z.uuid(),
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  makerNote: z.string().nullable(),
  seasonal: z.boolean(),
  legalClassification: productLegalClassificationSchema,
  manufacturerIdentity: z.string(),
  ceMarked: z.boolean(),
  fibreCompositionYarn: z.string().nullable(),
  fibreCompositionFilling: z.string().nullable(),
  careInstructions: z.string().nullable(),
  ageWarning: z.string().nullable(),
  safetyWarning: z.string().nullable(),
  categories: z.array(categoryRefSchema),
  variants: z.array(productVariantSchema),
  images: z.array(productImageSchema),
  status: productStatusSchema,
  // Always false for an anonymous caller - see the backend's ProductServiceImpl.
  favorited: z.boolean(),
});
export type ProductDetail = z.infer<typeof productDetailSchema>;

// `colours` is a comma-joined string, not an array: Spring's default binder splits a comma-separated
// query value into a List<String> on its own, so the wire format stays a single plain string param and this
// schema does not need array<->string juggling just to survive a round trip through the URL search params.
//
// No `page`/`size` here at all, deliberately - neither `types/pageable.ts`'s `paginationParamsSchema` (whose
// `size` is pinned to the admin data-table's PAGE_SIZES) nor a size of our own. "Load more" appends fixed-size
// pages through `useSuspenseInfiniteQuery`, so the page number is query state rather than URL state, and the
// URL stays a plain description of the *filter* - which is what a shopper shares and a crawler indexes.
export const CATALOGUE_PAGE_SIZE = 24;

export const productFiltersSchema = z.object({
  category: z.string().optional().catch(undefined),
  minPrice: z.number().optional().catch(undefined),
  maxPrice: z.number().optional().catch(undefined),
  colours: z.string().optional().catch(undefined),
  // Same comma-joined-string reasoning as `colours` above.
  sizes: z.string().optional().catch(undefined),
  materials: z.string().optional().catch(undefined),
  readyToShip: z.boolean().optional().catch(undefined),
  search: z.string().optional().catch(undefined),
  sort: productSortSchema.optional().catch(undefined),
  // Not a catalogue-page URL filter - only featuredProductsOptions ever sets this, never the /shop search params.
  featured: z.boolean().optional().catch(undefined),
});
export type ProductListFilters = z.infer<typeof productFiltersSchema>;
