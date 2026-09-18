import type { FC } from 'react';
import type { OrderStatus } from '@/schemas/orders';
import type { TranslationKey } from '@/hooks/use-translation';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/use-translation';

/**
 * Shared by `/orders`, `/orders/$orderId` and slice 7's admin order board.
 * An exhaustive switch (no `default`) so a future `OrderStatus` addition fails typecheck
 * instead of silently rendering a fallback badge.
 */
const STATUS_VARIANT: Record<OrderStatus, 'outline' | 'accent' | 'secondary' | 'destructive'> = {
  PENDING_PAYMENT: 'outline',
  PAID: 'accent',
  IN_PRODUCTION: 'accent',
  PACKED: 'accent',
  SHIPPED: 'accent',
  DELIVERED: 'secondary',
  CANCELLED: 'destructive',
  REFUNDED: 'destructive',
  RETURNED: 'destructive',
};

/** Exported for slice 7's order-management board, whose status `Select` needs the same labels this badge does. */
export const STATUS_LABEL_KEY: Record<OrderStatus, TranslationKey> = {
  PENDING_PAYMENT: 'orderStatusPendingPayment',
  PAID: 'orderStatusPaid',
  IN_PRODUCTION: 'orderStatusInProduction',
  PACKED: 'orderStatusPacked',
  SHIPPED: 'orderStatusShipped',
  DELIVERED: 'orderStatusDelivered',
  CANCELLED: 'orderStatusCancelled',
  REFUNDED: 'orderStatusRefunded',
  RETURNED: 'orderStatusReturned',
};

export const OrderStatusBadge: FC<{ readonly status: OrderStatus }> = ({ status }) => {
  const { t } = useTranslation();
  return <Badge variant={STATUS_VARIANT[status]}>{t(STATUS_LABEL_KEY[status])}</Badge>;
};
