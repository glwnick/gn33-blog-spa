import { createFileRoute } from '@tanstack/react-router';
import { NewProductPage, ProductFormPageSkeleton } from '@/pages/admin/product-form-page';
import { adminProductDefaultsOptions } from '@/query-options/admin-product-options';

// Unlike /users/new, no extra ADMIN-only beforeLoad guard: decision 4 puts product administration in both
// MANAGER's and ADMIN's hands, so the _manager layout's own gate is the whole story here.
export const Route = createFileRoute('/_auth/_manager/admin/products/new')({
  loader: ({ context }) => context.queryClient.ensureQueryData(adminProductDefaultsOptions()),
  component: NewProductPage,
  // Same reasoning as `routes/shop/index.tsx`'s own `pendingComponent` - only ever seen on a client-side
  // navigation with a cold cache, since a hard load already renders the real page server-side.
  pendingComponent: ProductFormPageSkeleton,
});
