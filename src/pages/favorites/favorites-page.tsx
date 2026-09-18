import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { AppContent } from '@/components/layout/app-content';
import { Button, buttonVariants } from '@/components/ui/button';
import { ButtonNavLink } from '@/components/ui/button-nav-link';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { ProductCard } from '@/pages/shop/product-card';
import { FAVORITES_PAGE_SIZE } from '@/schemas/favorites';
import { myFavoritesOptions } from '@/query-options/favorites-options';
import { useTranslation } from '@/hooks/use-translation';

export function FavoritesPage() {
  const { t } = useTranslation();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useSuspenseInfiniteQuery(
    myFavoritesOptions(),
  );
  const favorites = data.pages.flatMap((page) => page.content);

  return (
    <AppContent title={t('myFavoritesTitle')}>
      {favorites.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>{t('myFavoritesEmptyTitle')}</EmptyTitle>
            <EmptyDescription>{t('myFavoritesEmptyDescription')}</EmptyDescription>
          </EmptyHeader>
          <ButtonNavLink to="/shop" className={buttonVariants({ variant: 'default' })}>
            {t('shopBrowseCatalogue')}
          </ButtonNavLink>
        </Empty>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {favorites.map((product) => (
            <ProductCard key={product.id} product={product} />
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
              : t('shopLoadMore', { count: FAVORITES_PAGE_SIZE })}
          </Button>
        </div>
      )}
    </AppContent>
  );
}
