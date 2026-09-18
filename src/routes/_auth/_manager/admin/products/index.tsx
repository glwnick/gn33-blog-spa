import { createFileRoute } from '@tanstack/react-router';
import type { AdminProductListFilters } from '@/schemas/admin-products';
import { adminProductFiltersSchema } from '@/schemas/admin-products';
import { ProductListPage } from '@/pages/admin/product-list-page';

export const Route = createFileRoute('/_auth/_manager/admin/products/')({
  component: ProductListPage,
  validateSearch: (search) =>
    adminProductFiltersSchema.parse(search) as AdminProductListFilters,
});
