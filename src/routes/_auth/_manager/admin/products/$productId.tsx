import { createFileRoute } from '@tanstack/react-router';
import { EditProductPage, ProductFormPageSkeleton } from '@/pages/admin/product-form-page';
import { adminProductOptions } from '@/query-options/admin-product-options';

export const Route = createFileRoute('/_auth/_manager/admin/products/$productId')({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(adminProductOptions(params.productId)),
  component: RouteComponent,
  // Same reasoning as `routes/shop/index.tsx`'s own `pendingComponent` - only ever seen on a client-side
  // navigation with a cold cache, since a hard load already renders the real page server-side.
  pendingComponent: ProductFormPageSkeleton,
});

function RouteComponent() {
  const { productId } = Route.useParams();
  // Keyed by id so navigating between two products' edit screens remounts rather than reuses stale form state.
  return <EditProductPage key={productId} productId={productId} />;
}
