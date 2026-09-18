import { z } from 'zod';
import { orderLineSchema, orderStatusSchema } from './orders';
import { dateSchema, dateTimeSchema } from './common';

/**
 * Slice 7's order-management board card. Narrow projection, mirrors `OrderBoardCardResponseDto` - no email, no
 * shipping address, no `user`. `previewLines` reuses `orderLineSchema`, same as `orderSummarySchema`.
 */
export const orderBoardCardSchema = z.object({
  orderId: z.uuid(),
  orderNumber: z.string(),
  status: orderStatusSchema,
  itemCount: z.number().int(),
  total: z.number(),
  createdDate: dateTimeSchema,
  /** Null when nothing on the order resolves a making lead time - see the backend DTO. */
  dueDate: dateSchema.nullable(),
  previewLines: z.array(orderLineSchema),
});

export type OrderBoardCard = z.infer<typeof orderBoardCardSchema>;

/**
 * The board's five columns, in display order. `PENDING_PAYMENT` orders never appear in one of these - they sit
 * in the "Awaiting payment" strip above the board instead. `DELIVERED`/`REFUNDED`/`RETURNED` have no column: an
 * order that reaches one of those has left the active making pipeline.
 */
export const BOARD_COLUMN_STATUSES = [
  'PAID',
  'IN_PRODUCTION',
  'PACKED',
  'SHIPPED',
  'CANCELLED',
] as const;
