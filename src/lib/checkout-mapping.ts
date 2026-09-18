import type { CartLineItem } from '@/schemas/cart';
import type { CheckoutLineRequest } from '@/schemas/checkout';

/**
 * `personalisationAcknowledged` only matters for a made-to-order/one-of-a-kind line - a plain
 * ready-to-ship line has nothing to acknowledge, so it always reports `false` regardless of the
 * checkout form's single blanket checkbox.
 */
export const toCheckoutLines = (
  items: Array<CartLineItem>,
  personalisationAcknowledged: boolean,
): Array<CheckoutLineRequest> =>
  items.map((item) => ({
    variantId: item.variantId,
    quantity: item.quantity,
    personalisationAcknowledged:
      item.madeToOrder || item.oneOfAKind ? personalisationAcknowledged : false,
  }));
