import { useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Store } from 'lucide-react';
import { ProductCard } from '@/pages/shop/product-card';
import { AppContent } from '@/components/layout/app-content';
import { buttonVariants } from '@/components/ui/button';
import { ButtonNavLink } from '@/components/ui/button-nav-link';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { categoriesOptions } from '@/query-options/category-options';
import { featuredProductsOptions } from '@/query-options/product-options';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';

/**
 * The landing grid's size - a full grid rather than the home dashboard's 3-card teaser, since on this page
 * looking at product is the entire point. See `plans/PLAN-slice-6-shop-landing.md` decision 2: `count` is
 * part of `featuredProductsOptions`'s query key, so this and the dashboard's `FEATURED_PRODUCTS_COUNT` are
 * separate cache entries rather than one clobbering the other.
 */
export const LANDING_FEATURED_PRODUCTS_COUNT = 6;

/**
 * The shop landing page at `/` (slice 6a of `plans/PLAN-shop-surfaces.md`).
 *
 * The design handoff has no `/` screen - the 14 screens run member home then catalogue - so this is composed
 * from the catalogue's existing primitives rather than a bespoke visual language: a hero band capped at the
 * handoff's 26px hero type scale, a category entry-point row reusing the "wrap of outline pills" idiom the
 * handoff already specifies for the Yarn filter, and the featured grid using `ProductCard` **plain**, not
 * `compact` - buying is the point of a storefront grid in a way it is not for a dashboard teaser.
 */
export function LandingPage() {
  const { t } = useTranslation();
  const { data: featured } = useSuspenseQuery(
    featuredProductsOptions(LANDING_FEATURED_PRODUCTS_COUNT),
  );
  const { data: categories } = useSuspenseQuery(categoriesOptions());

  return (
    <AppContent
      title={
        <div className="flex flex-col gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t('landingHeroHeadline')}
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            {t('landingHeroTagline')}
          </p>
          <div>
            <ButtonNavLink
              to="/shop"
              className={cn(buttonVariants({ variant: 'default' }), 'gap-2')}
            >
              <Store className="size-4" />
              {t('shopBrowseCatalogue')}
            </ButtonNavLink>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        {categories.length > 0 && (
          <section className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Link
                key={category.id}
                to="/shop"
                search={{ category: category.slug }}
                className="rounded-full border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
              >
                {category.name}
              </Link>
            ))}
          </section>
        )}

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium">{t('landingFeaturedTitle')}</h2>

          {featured.content.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>{t('landingEmptyTitle')}</EmptyTitle>
                <EmptyDescription>{t('landingEmptyDescription')}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              {featured.content.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </div>
    </AppContent>
  );
}
