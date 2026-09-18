import { createFileRoute, notFound } from '@tanstack/react-router';
import { ProductDetailPage } from '@/pages/shop/product-detail-page';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { AppContent } from '@/components/layout/app-content';
import { ButtonLink } from '@/components/button-link';
import { productOptions } from '@/query-options/product-options';
import { ApiResponseError } from '@/lib/api-error';
import { useTranslation } from '@/hooks/use-translation';

/** Stage C of `plans/PLAN-public-catalogue.md`; same SSR reasoning as `routes/shop/index.tsx`. */
export const Route = createFileRoute('/shop/$slug')({
  loader: async ({ context, params }) => {
    try {
      await context.queryClient.ensureQueryData(productOptions(params.slug));
    } catch (error) {
      if (error instanceof ApiResponseError && error.status === 404) {
        throw notFound();
      }
      throw error;
    }
  },
  notFoundComponent: ProductNotFound,
  component: () => {
    const { slug } = Route.useParams();
    // Keyed by slug so navigating between two products remounts rather than reuses: the page holds the selected
    // variant and image in state, and neither carries any meaning on a different product.
    return <ProductDetailPage key={slug} slug={slug} />;
  },
});

function ProductNotFound() {
  const { t } = useTranslation();
  return (
    <AppContent title={t('shopTitle')}>
      <Empty>
        <EmptyHeader>
          <EmptyTitle>{t('shopProductNotFoundTitle')}</EmptyTitle>
          <EmptyDescription>{t('shopProductNotFoundDescription')}</EmptyDescription>
        </EmptyHeader>
        <ButtonLink to="/shop">{t('shopBrowseCatalogue')}</ButtonLink>
      </Empty>
    </AppContent>
  );
}
