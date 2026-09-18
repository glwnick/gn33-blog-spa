import { z } from 'zod';

/**
 * A cart line, keyed by `variantId`. Denormalised from `ProductDetail`/`ProductVariant` at add
 * time rather than referencing them by id, so the cart still renders (name, image, price) if the
 * product later changes - `unitPrice` in particular is deliberately frozen here per
 * ROADMAP.md's "unit price at time of add", not re-read from the product on every render.
 * `available`/`oneOfAKind`/`madeToOrder`/`leadTimeDays` are re-checked against the live product on
 * view (see `cart-page.tsx`), so this schema's `oneOfAKind` is only the value captured at add time.
 */
export const cartLineItemSchema = z.object({
  variantId: z.uuid(),
  productSlug: z.string(),
  productName: z.string(),
  imageUrl: z.string().nullable(),
  imageAltText: z.string().nullable(),
  sku: z.string(),
  size: z.string().nullable(),
  colourName: z.string().nullable(),
  unitPrice: z.number(),
  quantity: z.number().int().min(1),
  oneOfAKind: z.boolean(),
  madeToOrder: z.boolean(),
  leadTimeDays: z.number().nullable(),
});
export type CartLineItem = z.infer<typeof cartLineItemSchema>;

/** The shape persisted to `localStorage` under `CART_STORAGE_KEY` (see `cart-provider.tsx`). */
export const cartSchema = z.object({
  items: z.array(cartLineItemSchema),
});
export type Cart = z.infer<typeof cartSchema>;
