import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Printer } from 'lucide-react';
import { toast } from 'sonner';
import type { OrderBoardCard } from '@/schemas/order-board';
import type { OrderStatus } from '@/schemas/orders';
import { BOARD_COLUMN_STATUSES } from '@/schemas/order-board';
import { orderStatusSchema } from '@/schemas/orders';
import { orderBoardOptions } from '@/query-options/order-board-options';
import { ORDER_KEY } from '@/query-options/order-options';
import { updateOrderStatus } from '@/api/orders-api';
import { AppContent } from '@/components/layout/app-content';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { STATUS_LABEL_KEY } from '@/pages/orders/order-status-badge';
import { formatDate, formatPrice, toDate } from '@/lib/formatting';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';

/**
 * Statuses where a due date is still a live commitment. A shipped or cancelled order cannot be late any more,
 * so it shows its date plainly rather than in destructive red - the board's red is for work that needs doing
 * today, and a column of permanently-overdue shipped orders would train staff to ignore it.
 */
const DUE_DATE_LIVE_STATUSES: ReadonlySet<OrderStatus> = new Set([
  'PENDING_PAYMENT',
  'PAID',
  'IN_PRODUCTION',
  'PACKED',
]);

/** The handoff's card meta line: due date, or "Overdue {n} days" in destructive once the date has passed. */
function BoardCardDueMeta({ card }: { readonly card: OrderBoardCard }) {
  const { t } = useTranslation();

  if (card.dueDate === null) {
    return <span className="text-xs text-muted-foreground">{formatDate(card.createdDate)}</span>;
  }

  // Both sides floored to a day: `dueDate` is a LocalDate, so comparing it against a wall-clock instant would
  // report an order due today as overdue for all but the first moment of the day.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = toDate(card.dueDate);
  const daysLate = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  const isOverdue = daysLate > 0 && DUE_DATE_LIVE_STATUSES.has(card.status);

  return (
    <span className={cn('text-xs', isOverdue ? 'font-medium text-destructive' : 'text-muted-foreground')}>
      {isOverdue
        ? t('boardOverdue', { count: daysLate })
        : t('boardDueDate', { date: formatDate(card.dueDate) })}
    </span>
  );
}

const COLUMN_TITLE_KEY = {
  PAID: 'boardColumnNew',
  IN_PRODUCTION: 'boardColumnInProduction',
  PACKED: 'boardColumnReady',
  SHIPPED: 'boardColumnShipped',
  CANCELLED: 'boardColumnCancelled',
} as const;

export function OrderBoardPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: cards, isPending } = useQuery(orderBoardOptions());

  // Built here, not at module scope: `SelectValue`'s bare (childless) form resolves the trigger's
  // displayed text by matching `card.status` against this `items` array's `label`, so it must carry
  // the translated label, not the raw enum value.
  const statusItems = orderStatusSchema.options.map((status) => ({
    value: status,
    label: t(STATUS_LABEL_KEY[status]),
  }));

  const statusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ORDER_KEY, 'board'] });
    },
    // The backend's invalid-transition message reaches this toast verbatim - no bespoke wording here.
    onError: (err: Error) => toast.error(err.message),
  });

  const awaitingPayment = cards?.filter((c) => c.status === 'PENDING_PAYMENT') ?? [];
  const cardsByStatus = new Map<OrderStatus, Array<OrderBoardCard>>();
  for (const status of BOARD_COLUMN_STATUSES) {
    cardsByStatus.set(status, cards?.filter((c) => c.status === status) ?? []);
  }

  return (
    <AppContent
      title={t('orderManagementBoard')}
      isPending={isPending}
      fallback={<OrderBoardPageSkeleton />}
    >
      <div className="flex flex-col gap-6">
        <div className="flex justify-end print:hidden">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer /> {t('printPickingList')}
          </Button>
        </div>
        {awaitingPayment.length > 0 && (
          <Card>
            <CardHeader className="text-sm font-medium text-muted-foreground">
              {t('awaitingPayment')} ({awaitingPayment.length})
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {awaitingPayment.map((card) => (
                <div
                  key={card.orderId}
                  className="flex items-center gap-3 rounded-lg border p-2 text-sm"
                >
                  <span className="font-mono font-medium">{card.orderNumber}</span>
                  <span className="text-muted-foreground">{formatPrice(card.total)}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={statusMutation.isPending}
                    onClick={() =>
                      statusMutation.mutate({ orderId: card.orderId, status: 'PAID' })
                    }
                  >
                    {t('markAsPaid')}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {BOARD_COLUMN_STATUSES.map((status) => {
            const columnCards = cardsByStatus.get(status) ?? [];
            return (
              <div key={status} className="flex flex-col gap-2">
                <div className="flex items-center justify-between px-1 text-sm font-medium">
                  <span>{t(COLUMN_TITLE_KEY[status])}</span>
                  <span className="text-muted-foreground">{columnCards.length}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {columnCards.map((card) => (
                    <Card
                      key={card.orderId}
                      className={
                        card.status === 'CANCELLED' ? 'opacity-70' : undefined
                      }
                    >
                      <CardContent className="flex flex-col gap-2 p-3">
                        <span className="font-mono text-xs font-semibold">
                          {card.orderNumber}
                        </span>
                        <span className="text-sm">
                          {t('myOrdersItemCount', { count: card.itemCount })}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatPrice(card.total)}
                        </span>
                        <BoardCardDueMeta card={card} />
                        <Select
                          items={statusItems}
                          value={card.status}
                          disabled={statusMutation.isPending}
                          onValueChange={(value) =>
                            statusMutation.mutate({
                              orderId: card.orderId,
                              status: value as OrderStatus,
                            })
                          }
                        >
                          <SelectTrigger className="h-8 w-full text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {statusItems.map((item) => (
                                <SelectItem key={item.value} value={item.value}>
                                  {item.label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppContent>
  );
}

/** Matches the board's own shape: the print-button row, then one skeleton column per real
 * `BOARD_COLUMN_STATUSES` entry, each with a header and a couple of card-shaped blocks. The "Awaiting payment"
 * strip is omitted - it only renders at all when such orders exist, so a skeleton for it would promise a
 * section that may not show up once the real data lands. */
function OrderBoardPageSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <div className="flex justify-end">
        <Skeleton className="h-8 w-36" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {BOARD_COLUMN_STATUSES.map((status) => (
          <div key={status} className="flex flex-col gap-2">
            <Skeleton className="h-4 w-24" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-28 rounded-xl" />
              <Skeleton className="h-28 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
