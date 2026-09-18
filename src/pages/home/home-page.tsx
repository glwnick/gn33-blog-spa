import { useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Store } from 'lucide-react';
import { AccountCard } from '@/pages/home/account-card';
import { ActiveOrderCard } from '@/pages/home/active-order-card';
import { ProductCard } from '@/pages/shop/product-card';
import { AppContent } from '@/components/layout/app-content';
import { buttonVariants } from '@/components/ui/button';
import { ButtonNavLink } from '@/components/ui/button-nav-link';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { activeOrderIdOptions } from '@/query-options/order-options';
import { featuredProductsOptions } from '@/query-options/product-options';
import { useAuth } from '@/context/auth-provider';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';

/**
 * Authenticated home page (screen 1, `plans/PLAN-shop-surfaces.md` slice 5).
 *
 * Replaces the deliberately thin placeholder that shipped with slice 0: the fitness dashboard it originally
 * replaced (next booked class with a live countdown, activity chart, subscription card) went with that
 * domain, and until this slice the shop had nothing real to put in its place. It now leads with the active
 * order - see `plans/PLAN-slice-5-member-home.md` for what the handoff's screen asks for that has no
 * backing domain yet (seasonal batches, saved addresses, a wishlist) and was deliberately left out.
 */
export function HomePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: activeOrderId } = useSuspenseQuery(activeOrderIdOptions());
  const { data: featured } = useSuspenseQuery(featuredProductsOptions());

  return (
    <AppContent
      title={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              {t('homeGreeting', { fullName: user?.fullName ?? '' })}
            </h1>
            <p className="text-sm text-muted-foreground">
              {activeOrderId ? t('homeSubtitleWithOrder') : t('homeSubtitleNoOrder')}
            </p>
          </div>
          <ButtonNavLink
            to="/shop"
            className={cn(buttonVariants({ variant: 'default' }), 'gap-2')}
          >
            <Store className="size-4" />
            {t('shopBrowseCatalogue')}
          </ButtonNavLink>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-5">
          {activeOrderId ? (
            <ActiveOrderCard orderId={activeOrderId} />
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>{t('homeNoActiveOrderTitle')}</EmptyTitle>
                <EmptyDescription>{t('homeNoActiveOrderDescription')}</EmptyDescription>
              </EmptyHeader>
              <ButtonNavLink to="/shop" className={buttonVariants({ variant: 'default' })}>
                {t('shopBrowseCatalogue')}
              </ButtonNavLink>
            </Empty>
          )}

          {featured.content.length > 0 && (
            <section className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium">{t('homeFeaturedTitle')}</h2>
                <Link to="/shop" className="text-sm text-muted-foreground hover:text-primary-strong">
                  {t('homeFeaturedSeeAll', { count: featured.totalElements })}
                </Link>
              </div>
              {/* Two-up until `sm` for the same reason the catalogue grid is: three product cards across a
                  390px viewport leaves each one about 110px wide, too narrow for the name to survive. */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {featured.content.map((product) => (
                  <ProductCard key={product.id} product={product} compact />
                ))}
              </div>
            </section>
          )}
        </div>

        <AccountCard />
      </div>
    </AppContent>
  );
}
