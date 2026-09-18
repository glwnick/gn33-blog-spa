import { createFileRoute } from '@tanstack/react-router';
import { CataloguePage, CataloguePageSkeleton } from '@/pages/shop/catalogue-page';
import { productFiltersSchema } from '@/schemas/products';
import {
  catalogueFacetsOptions,
  productsOptions,
} from '@/query-options/product-options';
import { categoriesOptions } from '@/query-options/category-options';

/**
 * The public catalogue. Deliberately outside `_auth`/`_no-auth`/`terms`: those subtrees are `ssr: false` because
 * every page under them reads `useAuth()`, but the catalogue reads nothing from the session and an anonymous
 * crawler must get real product HTML in the first response. This is Stage B of
 * `plans/PLAN-public-catalogue.md`, the first route in the app to actually prefetch data in its loader.
 */
export const Route = createFileRoute('/shop/')({
  validateSearch: (search) => productFiltersSchema.parse(search),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    Promise.all([
      context.queryClient.ensureInfiniteQueryData(productsOptions(deps)),
      context.queryClient.ensureQueryData(categoriesOptions()),
      // Not in `loaderDeps`: the facets describe the whole catalogue, so they are the same response whatever the
      // shopper has narrowed to, and re-requesting them per filter change would be a query per keystroke.
      context.queryClient.ensureQueryData(catalogueFacetsOptions()),
    ]),
  // Only ever seen on a client-side navigation that changes the filters before the loader above resolves - the
  // initial load is server-rendered with this data already dehydrated, so the pending state never shows there.
  pendingComponent: CataloguePageSkeleton,
  component: CataloguePage,
});
