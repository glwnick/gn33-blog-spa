import { z } from 'zod';
import { checkoutAddressSchema } from './checkout';
import { dateTimeSchema } from './common';

export const orderStatusSchema = z.enum([
  'PENDING_PAYMENT',
  'PAID',
  'IN_PRODUCTION',
  'PACKED',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
  'RETURNED',
]);
export type OrderStatus = z.infer<typeof orderStatusSchema>;

/**
 * `productName`/`sku`/`size`/`colourName`/`unitPrice`/`quantity` are the immutable checkout-time snapshot.
 * `imageUrl`/`imageAltText`/`productSlug` are not: the backend resolves them live through the line's variant, so
 * they are nullable and can change on an old order as the product listing changes - see
 * `OrderLineResponseDto`'s javadoc.
 */
export const orderLineSchema = z.object({
  productName: z.string(),
  sku: z.string(),
  size: z.string().nullable(),
  colourName: z.string().nullable(),
  unitPrice: z.number(),
  quantity: z.number().int(),
  imageUrl: z.string().nullable(),
  imageAltText: z.string().nullable(),
  productSlug: z.string().nullable(),
});
export type OrderLine = z.infer<typeof orderLineSchema>;

export const orderConfirmationSchema = z.object({
  orderId: z.uuid(),
  orderNumber: z.string(),
  status: orderStatusSchema,
  subtotal: z.number(),
  shippingCost: z.number(),
  total: z.number(),
  lines: z.array(orderLineSchema),
  // Nullable (M6, SECURITY-AUDIT-2026-09-15.md / plans/PLAN-security-audit-fixes.md): the backend stops
  // returning the address once an order is no longer PENDING_PAYMENT and is older than its exposure window,
  // so a bare-UUID confirmation link cannot disclose it indefinitely. order-confirmation-page.tsx never
  // rendered this field anyway, so nothing here needs a null-check beyond the schema itself.
  shippingAddress: checkoutAddressSchema.nullable(),
  confirmationToken: z.uuid(),
});
export type OrderConfirmation = z.infer<typeof orderConfirmationSchema>;

/** The four filter pills on `/orders`. Mirrors `OrderListFilter` on the backend, which owns the status mapping. */
export const orderListFilterSchema = z.enum(['ALL', 'OPEN', 'DELIVERED', 'CANCELLED']);
export type OrderListFilter = z.infer<typeof orderListFilterSchema>;

// The route's search params: the filter is URL state, same reasoning as `productFiltersSchema` - a
// filtered list is linkable and survives a refresh. `optional().catch(undefined)` matches
// `productFiltersSchema`'s own pattern, so a bare `/orders` link needs no search param and the page
// falls back to `ALL` itself, the same way `catalogue-toolbar.tsx` falls back to `sort ?? 'NEWEST'`.
export const orderListSearchSchema = z.object({
  filter: orderListFilterSchema.optional().catch(undefined),
});
export type OrderListSearch = z.infer<typeof orderListSearchSchema>;

/** One row of the "my orders" list. `previewLines` is capped at two server-side, matching the row card's thumbs. */
export const orderSummarySchema = z.object({
  id: z.uuid(),
  orderNumber: z.string(),
  status: orderStatusSchema,
  total: z.number(),
  placedAt: dateTimeSchema,
  itemCount: z.number().int(),
  previewLines: z.array(orderLineSchema),
});
export type OrderSummary = z.infer<typeof orderSummarySchema>;

/**
 * Screen 7 - the order detail page. `cancellable`/`cancellableUntil` are computed server-side from a setting this
 * app never exposes to a customer-facing endpoint, so the countdown card renders only what it is told here and
 * never re-derives the rule itself.
 */
export const orderDetailSchema = z.object({
  id: z.uuid(),
  orderNumber: z.string(),
  status: orderStatusSchema,
  subtotal: z.number(),
  shippingCost: z.number(),
  total: z.number(),
  placedAt: dateTimeSchema,
  cancelledAt: dateTimeSchema.nullable(),
  lines: z.array(orderLineSchema),
  shippingAddress: checkoutAddressSchema,
  cancellable: z.boolean(),
  cancellableUntil: dateTimeSchema.nullable(),
});
export type OrderDetail = z.infer<typeof orderDetailSchema>;

// "Load more" list, not a page-number list - see `query-options/order-options.ts`'s `myOrdersOptions`, which
// mirrors `productsOptions`'s shape.
export const ORDERS_PAGE_SIZE = 10;
