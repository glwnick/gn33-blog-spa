import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { toast } from 'sonner';
import type { OrderDetail, OrderStatus } from '@/schemas/orders';
import type { TranslationKey } from '@/hooks/use-translation';
import { OrderStatusBadge } from '@/pages/orders/order-status-badge';
import { AppContent } from '@/components/layout/app-content';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ConfirmAlertDialog } from '@/components/confirm-alert-dialog';
import { HeaderAlert } from '@/components/header-alert';
import { cancelOrder } from '@/api/orders-api';
import { ORDER_KEY, orderOptions } from '@/query-options/order-options';
import { useAlertMutation } from '@/hooks/use-alert-mutation';
import { useTranslation } from '@/hooks/use-translation';
import { formatDateTime, formatPrice, roundToCents, toDate } from '@/lib/formatting';
import { productImageSrc } from '@/lib/product-image-src';
import { cn } from '@/lib/utils';

/**
 * Statuses that make up the forward progression. A cancelled/refunded/returned order replaces the
 * tail of this sequence with a single terminal node instead - see `buildTimelineNodes` below.
 */
const PROGRESS_STATUSES = [
  'PENDING_PAYMENT',
  'PAID',
  'IN_PRODUCTION',
  'PACKED',
  'SHIPPED',
  'DELIVERED',
] as const satisfies ReadonlyArray<OrderStatus>;

/** Every status's timeline label in one place, exhaustive over `OrderStatus` like `order-status-badge.tsx`'s
 * own `Record`, so a future status added to the schema without an entry here fails to compile rather than
 * silently rendering `undefined`. */
const TIMELINE_LABEL_KEY: Record<OrderStatus, TranslationKey> = {
  PENDING_PAYMENT: 'myOrdersTimelinePlaced',
  PAID: 'myOrdersTimelinePaid',
  IN_PRODUCTION: 'myOrdersTimelineInProduction',
  PACKED: 'myOrdersTimelinePacked',
  SHIPPED: 'myOrdersTimelineShipped',
  DELIVERED: 'myOrdersTimelineDelivered',
  CANCELLED: 'myOrdersTimelineCancelled',
  REFUNDED: 'myOrdersTimelineRefunded',
  RETURNED: 'myOrdersTimelineReturned',
};

/** Also exhaustive over `OrderStatus`, for the same reason: `PROGRESS_STATUSES.indexOf` would otherwise return
 * -1 for a status neither list has been updated to cover, rendering every timeline node as incomplete instead
 * of failing to compile. Narrowing `order.status` at each call site depends on this being a type predicate
 * used directly in a condition, not stashed in a plain `boolean` first. */
const TERMINAL_STATUS_KIND: Record<OrderStatus, 'progress' | 'terminal'> = {
  PENDING_PAYMENT: 'progress',
  PAID: 'progress',
  IN_PRODUCTION: 'progress',
  PACKED: 'progress',
  SHIPPED: 'progress',
  DELIVERED: 'progress',
  CANCELLED: 'terminal',
  REFUNDED: 'terminal',
  RETURNED: 'terminal',
};

const isTerminalStatus = (
  status: OrderStatus,
): status is 'CANCELLED' | 'REFUNDED' | 'RETURNED' => TERMINAL_STATUS_KIND[status] === 'terminal';

export function OrderDetailPage({ orderId }: { readonly orderId: string }) {
  const { t } = useTranslation();
  const { data: order } = useSuspenseQuery(orderOptions(orderId));
  const queryClient = useQueryClient();

  const {
    mutate: cancelMutation,
    alertError,
    clearAlertError,
  } = useAlertMutation({
    mutationFn: () => cancelOrder(orderId),
    onSuccess: () => {
      toast.success(t('myOrdersCancelSuccess'));
      queryClient.invalidateQueries({ queryKey: [ORDER_KEY] });
    },
  });

  return (
    <AppContent
      title={
        <div className="mb-2 flex flex-col gap-2">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link to="/orders" />}>
                  {t('myOrdersTitle')}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-mono">{order.orderNumber}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex items-center gap-2">
            <h1 className="truncate font-mono text-xl font-semibold tracking-tight">
              {order.orderNumber}
            </h1>
            <OrderStatusBadge status={order.status} />
          </div>
        </div>
      }
    >
      <HeaderAlert error={alertError} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('myOrdersTimelineTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderTimeline order={order} />
            </CardContent>
          </Card>

          <Card className="gap-0 divide-y p-0">
            {order.lines.map((line) => (
              <div key={line.sku} className="flex gap-3 p-4">
                <div className="size-13 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {line.imageUrl && (
                    <img
                      src={productImageSrc(line.imageUrl)}
                      alt={line.imageAltText ?? ''}
                      className="size-full object-cover"
                    />
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-0.5">
                  <p className="text-sm font-medium">{line.productName}</p>
                  {(line.size || line.colourName) && (
                    <p className="text-xs text-muted-foreground">
                      {[line.size, line.colourName].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  {line.quantity > 1 && (
                    <p className="text-xs text-muted-foreground">× {line.quantity}</p>
                  )}
                </div>
                <p className="shrink-0 text-sm font-semibold">
                  {formatPrice(roundToCents(line.unitPrice * line.quantity))}
                </p>
              </div>
            ))}
            <div className="flex flex-col gap-1 p-4 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>{t('checkoutSubtotal')}</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>{t('checkoutShipping')}</span>
                <span>{formatPrice(order.shippingCost)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold">
                <span>{t('checkoutTotal')}</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('myOrdersDeliveringTo')}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p className="text-foreground">{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.street}</p>
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.postalCode}
              </p>
              <p>{order.shippingAddress.phone}</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex h-fit flex-col gap-4">
          {!isTerminalStatus(order.status) && (
            <CancellationCard
              order={order}
              onCancel={() => {
                clearAlertError();
                cancelMutation();
              }}
            />
          )}
        </div>
      </div>
    </AppContent>
  );
}

/**
 * Derived from `status`/`placedAt`/`cancelledAt`, never stored: there is no `order_status_history` table
 * yet (plans/PLAN-slice-4-my-orders.md), so only Placed and a terminal Cancelled/Refunded/Returned node can
 * carry a real timestamp. Every other node renders title-only, completed or future by sequence position.
 * Per-node timestamps need `order_status_history`, planned for slice 7 alongside the admin status board.
 */
type TimelineNode = {
  readonly key: string;
  readonly label: string;
  readonly timestamp: string | null;
  readonly completed: boolean;
};

/**
 * The `isTerminalStatus(order.status)` check has to appear directly in this `if`, not through a `boolean`
 * pulled out beforehand, because only the direct call site is where TypeScript narrows `order.status` - that
 * narrowing is what makes `TIMELINE_LABEL_KEY[order.status]` and `PROGRESS_STATUSES.indexOf(order.status)`
 * below typecheck without an unsafe cast back to a wider status union.
 */
function buildTimelineNodes(
  order: OrderDetail,
  t: (key: TranslationKey) => string,
): ReadonlyArray<TimelineNode> {
  if (isTerminalStatus(order.status)) {
    return [
      {
        key: 'PENDING_PAYMENT',
        label: t('myOrdersTimelinePlaced'),
        timestamp: order.placedAt,
        completed: true,
      },
      {
        key: order.status,
        label: t(TIMELINE_LABEL_KEY[order.status]),
        timestamp: order.status === 'CANCELLED' ? order.cancelledAt : null,
        completed: true,
      },
    ];
  }

  const currentIndex = PROGRESS_STATUSES.indexOf(order.status);
  return PROGRESS_STATUSES.map((status, index) => ({
    key: status,
    label: t(TIMELINE_LABEL_KEY[status]),
    timestamp: status === 'PENDING_PAYMENT' ? order.placedAt : null,
    completed: index <= currentIndex,
  }));
}

function OrderTimeline({ order }: { readonly order: OrderDetail }) {
  const { t } = useTranslation();
  const nodes = buildTimelineNodes(order, t);

  return (
    <div className="flex flex-col">
      {nodes.map((node, index) => {
        return (
          <div key={node.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn('size-3 shrink-0 rounded-full', node.completed ? 'bg-primary' : 'bg-muted')}
              />
              {index < nodes.length - 1 && (
                <span className={cn('w-0.5 flex-1', node.completed ? 'bg-primary' : 'bg-muted')} />
              )}
            </div>
            <div className={cn('flex flex-col gap-0.5 pb-4', index === nodes.length - 1 && 'pb-0')}>
              <span className={cn('text-sm font-medium', !node.completed && 'text-muted-foreground')}>
                {node.label}
              </span>
              {node.timestamp && (
                <span className="text-[13px] text-muted-foreground">
                  {formatDateTime(node.timestamp)}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Rendered only for a non-terminal order. Accent card with the "Cancel order" affordance while
 * `cancellable`; otherwise a static explanatory note. Not a link to a returns-policy document: no
 * `LegalDocumentType` for returns exists yet (only `TERMS`/`GDPR`), so this mirrors the same static-text
 * treatment the product page's own "Returns & cancellation" accordion already uses, rather than pointing at
 * a page that would 404 or misdirect to the unrelated `/terms` consent-gate route.
 */
function CancellationCard({
  order,
  onCancel,
}: {
  readonly order: OrderDetail;
  readonly onCancel: () => void;
}) {
  const { t } = useTranslation();

  if (!order.cancellable || !order.cancellableUntil) {
    return (
      <div className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
        {t('myOrdersReturnsPolicyNote')}
      </div>
    );
  }

  const placed = toDate(order.placedAt);
  const deadline = toDate(order.cancellableUntil);
  const totalMs = deadline.getTime() - placed.getTime();
  const remainingMs = deadline.getTime() - Date.now();
  const percentRemaining = totalMs > 0 ? Math.max(0, Math.min(100, (remainingMs / totalMs) * 100)) : 0;

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-accent p-4 text-accent-foreground">
      <p className="text-sm">
        {t('myOrdersCancellationWindowNote', { deadline: formatDateTime(order.cancellableUntil) })}
      </p>
      <Progress value={percentRemaining} />
      <ConfirmAlertDialog
        triggerButton={
          <Button variant="destructive" className="w-full">
            {t('myOrdersCancelOrder')}
          </Button>
        }
        title={t('myOrdersCancelDialogTitle')}
        description={t('myOrdersCancelDialogDescription', {
          deadline: formatDateTime(order.cancellableUntil),
        })}
        action={onCancel}
      />
    </div>
  );
}
