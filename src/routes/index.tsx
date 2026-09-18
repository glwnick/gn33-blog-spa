import { createFileRoute } from '@tanstack/react-router';
import {
  LANDING_FEATURED_PRODUCTS_COUNT,
  LandingPage,
} from '@/pages/landing/landing-page';
import { categoriesOptions } from '@/query-options/category-options';
import { featuredProductsOptions } from '@/query-options/product-options';

/**
 * The shop landing page (slice 6a of `plans/PLAN-shop-surfaces.md`, stage D of
 * `plans/PLAN-public-catalogue.md`). No longer redirects an authenticated visitor to `/home`: once `/` is the
 * shop, a signed-in visitor sees the same storefront as everyone else, and `/home` stays one click away in
 * `USER_NAV_ITEMS`. Deliberately outside `_auth`/`_no-auth`/`terms`, like `/shop`: it reads nothing from the
 * session and prefetches in its loader so a crawler's first response carries real product HTML.
 */
export const Route = createFileRoute('/')({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(
        featuredProductsOptions(LANDING_FEATURED_PRODUCTS_COUNT),
      ),
      context.queryClient.ensureQueryData(categoriesOptions()),
    ]),
  component: LandingPage,
});
