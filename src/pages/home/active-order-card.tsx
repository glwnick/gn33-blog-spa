import { useSuspenseQuery } from '@tanstack/react-query';
import type { OrderDetail, OrderStatus } from '@/schemas/orders';
import type { TranslationKey } from '@/hooks/use-translation';
import { OrderStatusBadge } from '@/pages/orders/order-status-badge';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { ButtonNavLink } from '@/components/ui/button-nav-link';
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { orderOptions } from '@/query-options/order-options';
import { useTranslation } from '@/hooks/use-translation';
import { formatDate, toDate } from '@/lib/formatting';
import { productImageSrc } from '@/lib/product-image-src';
import { cn } from '@/lib/utils';

/**
 * The four dashboard rail nodes, each a bucket of one or more of `OrderTimeline`'s six forward statuses
 * (`order-detail-page.tsx`) - the handoff's dashboard rail is a compact horizontal summary, not the detail
 * page's per-status vertical one, so it does not need a one-to-one mapping.
 *
 * Exhaustive over `OrderStatus` for the same reason `order-detail-page.tsx`'s own `TERMINAL_STATUS_KIND` is:
 * a future status addition should fail to compile here rather than silently render every node as incomplete.
 * `CANCELLED`/`REFUNDED`/`RETURNED` are dead branches in practice - this card only renders for an order in
 * `OrderListFilter.OPEN`, which excludes all three - but the map still has to cover them to typecheck.
 */
const HOME_RAIL_RANK: Record<OrderStatus, number> = {
  PENDING_PAYMENT: 0,
  PAID: 1,
  IN_PRODUCTION: 1,
  PACKED: 1,
  SHIPPED: 2,
  DELIVERED: 3,
  CANCELLED: 0,
  REFUNDED: 0,
  RETURNED: 0,
};

const HOME_RAIL_LABEL_KEY: ReadonlyArray<TranslationKey> = [
  'myOrdersTimelinePlaced',
  'homeTimelineInTheMaking',
  'myOrdersTimelineShipped',
  'myOrdersTimelineDelivered',
];

/**
 * Mirrors `OrderListFilter.OPEN` on the backend. `activeOrderIdOptions()` only ever hands this component an
 * id from that filter, and today the only way to move an order out of it is this SPA's own cancel mutation,
 * which invalidates `activeOrderIdOptions` and `orderOptions` together - so the two stay in sync in practice.
 * That stops being true once something outside this SPA (slice 7's admin order board) can change status:
 * `orderOptions(orderId)`'s hour-long `staleTime` could then hand this card a terminal-status order, which
 * would show a destructive `OrderStatusBadge` next to a green "On track" badge and a rail implying progress.
 * Checked explicitly rather than trusted, the same way the backend re-checks `cancellable` server-side
 * instead of trusting a client that saw the flag earlier.
 */
const OPEN_STATUSES: ReadonlySet<OrderStatus> = new Set([
  'PENDING_PAYMENT',
  'PAID',
  'IN_PRODUCTION',
  'PACKED',
  'SHIPPED',
]);

export function ActiveOrderRail({ status }: { readonly status: OrderStatus }) {
  const { t } = useTranslation();
  const currentRank = HOME_RAIL_RANK[status];

  return (
    <div className="flex items-center">
      {HOME_RAIL_LABEL_KEY.map((labelKey, index) => {
        const completed = index <= currentRank;
        return (
          <div key={labelKey} className="flex flex-1 flex-col items-center gap-1.5 last:flex-none">
            <div className="flex w-full items-center">
              <span
                className={cn(
                  'size-2.5 shrink-0 rounded-full',
                  completed ? 'bg-primary' : 'bg-border',
                )}
              />
              {index < HOME_RAIL_LABEL_KEY.length - 1 && (
                <span
                  className={cn('h-0.75 flex-1', index < currentRank ? 'bg-primary' : 'bg-border')}
                />
              )}
            </div>
            <span
              className={cn(
                'text-center text-xs',
                completed ? 'font-medium text-foreground' : 'text-muted-foreground',
              )}
            >
              {t(labelKey)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Duration remaining, not a deadline - `order-detail-page.tsx`'s cancellation card states the deadline
 * timestamp instead, but this is a compact dashboard flourish, not the record of truth. */
function CancellationCountdown({ cancellableUntil }: { readonly cancellableUntil: string }) {
  const { t } = useTranslation();
  const remainingMs = Math.max(0, toDate(cancellableUntil).getTime() - Date.now());
  const hours = Math.floor(remainingMs / (1000 * 60 * 60));
  const minutes = Math.floor((remainingMs / (1000 * 60)) % 60);

  return (
    <span className="text-xs text-muted-foreground">
      {t('homeCancellationCountdown', { hours, minutes })}
    </span>
  );
}

/**
 * The home dashboard's active-order card - rendered by `home-page.tsx` only when
 * `activeOrderIdOptions()` resolved an id. Sources the full `OrderDetail` (not the narrower
 * `OrderSummary` the `/orders` list uses) because the countdown needs `cancellable`/`cancellableUntil`,
 * which only the detail DTO carries - see `plans/PLAN-slice-5-member-home.md`.
 */
export function ActiveOrderCard({ orderId }: { readonly orderId: string }) {
  const { t } = useTranslation();
  const { data: order } = useSuspenseQuery(orderOptions(orderId));
  const itemCount = order.lines.reduce((sum: number, line) => sum + line.quantity, 0);

  if (!OPEN_STATUSES.has(order.status)) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="font-mono">{t('homeOrderTitle', { orderNumber: order.orderNumber })}</span>
          <OrderStatusBadge status={order.status} />
        </CardTitle>
        <CardAction>
          <Badge variant="accent">{t('homeOrderOnTrack')}</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          {t('homeOrderPlacedOn', { date: formatDate(order.placedAt) })}
        </p>
        <ActiveOrderRail status={order.status} />
        <ActiveOrderItems order={order} itemCount={itemCount} />
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-3">
        <ButtonNavLink
          to="/orders/$orderId"
          params={{ orderId: order.id }}
          className={buttonVariants({ variant: 'outline', size: 'sm' })}
        >
          {t('homeTrackOrder')}
        </ButtonNavLink>
        {order.cancellable && order.cancellableUntil && (
          <CancellationCountdown cancellableUntil={order.cancellableUntil} />
        )}
      </CardFooter>
    </Card>
  );
}

function ActiveOrderItems({
  order,
  itemCount,
}: {
  readonly order: OrderDetail;
  readonly itemCount: number;
}) {
  const { t } = useTranslation();
  const thumbLines = order.lines.slice(0, 2);

  return (
    <div className="flex items-center gap-3">
      <div className="flex shrink-0 -space-x-3">
        {thumbLines.map((line) => (
          <div
            key={line.sku}
            className="size-14 overflow-hidden rounded-lg bg-muted ring-2 ring-background"
          >
            {line.imageUrl && (
              <img
                src={productImageSrc(line.imageUrl)}
                alt={line.imageAltText ?? ''}
                className="size-full object-cover"
              />
            )}
          </div>
        ))}
      </div>
      <p className="truncate text-sm text-muted-foreground">
        {t('myOrdersItemCount', { count: itemCount })}
      </p>
    </div>
  );
}
