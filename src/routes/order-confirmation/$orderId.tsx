import { createFileRoute, notFound } from '@tanstack/react-router';
import { OrderConfirmationPage } from '@/pages/shop/order-confirmation-page';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { AppContent } from '@/components/layout/app-content';
import { buttonVariants } from '@/components/ui/button';
import { ButtonNavLink } from '@/components/ui/button-nav-link';
import { orderConfirmationOptions } from '@/query-options/checkout-options';
import { ApiResponseError } from '@/lib/api-error';
import { useTranslation } from '@/hooks/use-translation';

/** Per-visitor, token-bearing URL with no SEO value - `ssr: false`, same reasoning as `/checkout` and `/cart`. */
export const Route = createFileRoute('/order-confirmation/$orderId')({
  ssr: false,
  loader: async ({ context, params }) => {
    try {
      await context.queryClient.ensureQueryData(orderConfirmationOptions(params.orderId));
    } catch (error) {
      if (error instanceof ApiResponseError && error.status === 404) {
        throw notFound();
      }
      throw error;
    }
  },
  notFoundComponent: OrderNotFound,
  component: () => {
    const { orderId } = Route.useParams();
    return <OrderConfirmationPage orderId={orderId} />;
  },
});

function OrderNotFound() {
  const { t } = useTranslation();
  return (
    <AppContent title={t('orderConfirmationTitle')}>
      <Empty>
        <EmptyHeader>
          <EmptyTitle>{t('orderConfirmationNotFoundTitle')}</EmptyTitle>
          <EmptyDescription>{t('orderConfirmationNotFoundDescription')}</EmptyDescription>
        </EmptyHeader>
        <ButtonNavLink to="/shop" className={buttonVariants({ variant: 'default' })}>
          {t('shopBrowseCatalogue')}
        </ButtonNavLink>
      </Empty>
    </AppContent>
  );
}
