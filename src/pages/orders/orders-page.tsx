import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import type { OrderListFilter, OrderSummary } from '@/schemas/orders';
import { OrderStatusBadge } from '@/pages/orders/order-status-badge';
import { AppContent } from '@/components/layout/app-content';
import { Button, buttonVariants } from '@/components/ui/button';
import { ButtonNavLink } from '@/components/ui/button-nav-link';
import { Card } from '@/components/ui/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { ORDERS_PAGE_SIZE } from '@/schemas/orders';
import { myOrdersOptions } from '@/query-options/order-options';
import { useFilters } from '@/hooks/use-filters';
import { useTranslation } from '@/hooks/use-translation';
import { formatDate, formatPrice } from '@/lib/formatting';
import { productImageSrc } from '@/lib/product-image-src';
import { cn } from '@/lib/utils';

const FILTER_PILLS: ReadonlyArray<OrderListFilter> = ['ALL', 'OPEN', 'DELIVERED', 'CANCELLED'];

export function OrdersPage() {
  const { t } = useTranslation();
  const { filters, setFilters } = useFilters('/_auth/orders/');

  const activeFilter = filters.filter ?? 'ALL';
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useSuspenseInfiniteQuery(
    myOrdersOptions(activeFilter),
  );
  const orders = data.pages.flatMap((page) => page.content);

  return (
    <AppContent title={t('myOrdersTitle')}>
      <div className="mb-4 flex flex-wrap justify-end gap-2">
        {FILTER_PILLS.map((pill) => (
          <Button
            key={pill}
            size="sm"
            variant={activeFilter === pill ? 'default' : 'outline'}
            className="rounded-full"
            onClick={() => setFilters({ filter: pill })}
          >
            {t(`myOrdersFilter${pill}` as const)}
          </Button>
        ))}
      </div>

      {orders.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>{t('myOrdersEmptyTitle')}</EmptyTitle>
            <EmptyDescription>{t('myOrdersEmptyDescription')}</EmptyDescription>
          </EmptyHeader>
          <ButtonNavLink to="/shop" className={buttonVariants({ variant: 'default' })}>
            {t('shopBrowseCatalogue')}
          </ButtonNavLink>
        </Empty>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <OrderRow key={order.id} order={order} />
          ))}
        </div>
      )}

      {hasNextPage && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            disabled={isFetchingNextPage}
            onClick={() => void fetchNextPage()}
          >
            {isFetchingNextPage
              ? t('shopLoadingMore')
              : t('shopLoadMore', { count: ORDERS_PAGE_SIZE })}
          </Button>
        </div>
      )}
    </AppContent>
  );
}

function OrderRow({ order }: { readonly order: OrderSummary }) {
  const { t } = useTranslation();

  return (
    <Card className="flex flex-row items-center gap-3 px-4 py-4">
      <div className="flex shrink-0 -space-x-3">
        {(order.previewLines.length > 0 ? order.previewLines : [null, null]).map((line, index) => (
          <div
            key={line?.sku ?? index}
            className={cn(
              'size-13 overflow-hidden rounded-lg bg-muted ring-2 ring-background',
            )}
          >
            {line?.imageUrl && (
              <img
                src={productImageSrc(line.imageUrl)}
                alt={line.imageAltText ?? ''}
                className="size-full object-cover"
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-medium">{order.orderNumber}</span>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="truncate text-sm text-muted-foreground">
          {t('myOrdersItemCount', { count: order.itemCount })}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        <p className="text-[15px] font-semibold">{formatPrice(order.total)}</p>
        <p className="text-xs text-muted-foreground">{formatDate(order.placedAt)}</p>
      </div>

      <ButtonNavLink
        to="/orders/$orderId"
        params={{ orderId: order.id }}
        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'shrink-0')}
      >
        {t('myOrdersDetails')}
      </ButtonNavLink>
    </Card>
  );
}
