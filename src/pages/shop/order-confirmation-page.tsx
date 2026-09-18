import { useSuspenseQuery } from '@tanstack/react-query';
import { AppContent } from '@/components/layout/app-content';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ButtonNavLink } from '@/components/ui/button-nav-link';
import { orderConfirmationOptions } from '@/query-options/checkout-options';
import { useAuth } from '@/context/auth-provider';
import { useTranslation } from '@/hooks/use-translation';
import { formatPrice, roundToCents } from '@/lib/formatting';
import { cn } from '@/lib/utils';

export function OrderConfirmationPage({ orderId }: { orderId: string }) {
  const { t } = useTranslation();
  const { user, isInitializing } = useAuth();
  const { data: order } = useSuspenseQuery(orderConfirmationOptions(orderId));

  return (
    <AppContent
      title={t('orderConfirmationTitle')}
      isPending={isInitializing}
      fallback={<OrderConfirmationPageSkeleton />}
    >
      <Card className="mx-auto max-w-lg">
        <CardContent className="flex flex-col gap-4 text-center">
        <p className="text-sm text-muted-foreground">{t('orderConfirmationOrderNumber')}</p>
        <p className="text-2xl font-semibold">{order.orderNumber}</p>

        <div className="flex flex-col gap-2 rounded-lg border p-4 text-left">
          {order.lines.map((line) => (
            <div key={line.sku} className="flex justify-between gap-2 text-sm">
              <span className="text-muted-foreground">
                {line.productName}
                {line.quantity > 1 ? ` × ${line.quantity}` : ''}
              </span>
              <span>{formatPrice(roundToCents(line.unitPrice * line.quantity))}</span>
            </div>
          ))}
          <div className="flex justify-between border-t pt-2 text-base font-semibold">
            <span>{t('checkoutTotal')}</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>

        <p className="rounded-lg bg-accent p-3 text-sm text-accent-foreground">
          {t('orderConfirmationPaymentNote')}
        </p>

        <div className="flex gap-2">
          {/* A guest has no `/orders` to land on - their only access stays the confirmation link in their
              email, per plans/PLAN-slice-4-my-orders.md conflict 3. */}
          {user && (
            <ButtonNavLink
              to="/orders/$orderId"
              params={{ orderId: order.orderId }}
              className={cn(buttonVariants({ variant: 'outline' }), 'flex-1')}
            >
              {t('orderConfirmationViewOrder')}
            </ButtonNavLink>
          )}
          <ButtonNavLink
            to="/shop"
            className={cn(buttonVariants({ variant: 'default' }), 'flex-1')}
          >
            {t('orderConfirmationContinueShopping')}
          </ButtonNavLink>
        </div>
        </CardContent>
      </Card>
    </AppContent>
  );
}

/** Same centered-card shape as the real content, matching the sibling `XPageSkeleton` functions this diff added
 * elsewhere (settings-page.tsx, checkout-page.tsx, order-board-page.tsx). */
function OrderConfirmationPageSkeleton() {
  return (
    <Card className="mx-auto max-w-lg">
      <CardContent className="flex flex-col items-center gap-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
        <div className="flex w-full gap-2">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 flex-1" />
        </div>
      </CardContent>
    </Card>
  );
}
