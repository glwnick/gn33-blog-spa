import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, SearchIcon } from 'lucide-react';
import { AppContent } from '@/components/layout/app-content';
import { AllFeatureTable } from '@/components/data-table/all-feature-table';
import { TablePageSkeleton } from '@/components/data-table/table-page-skeleton';
import { ButtonLink } from '@/components/button-link';
import { DebouncedInput } from '@/components/debounce-input';
import { columns } from '@/pages/admin/product-columns';
import { adminProductsOptions } from '@/query-options/admin-product-options';
import { categoriesOptions } from '@/query-options/category-options';
import { useFilters } from '@/hooks/use-filters';
import { useTranslation } from '@/hooks/use-translation';

const ADMIN_PRODUCTS_ROUTE_ID = '/_auth/_manager/admin/products/' as const;

export function ProductListPage() {
  const { t } = useTranslation();
  const filter = useFilters(ADMIN_PRODUCTS_ROUTE_ID);
  const { data: productsPage, isLoading } = useQuery(adminProductsOptions(filter.filters));
  const { data: categories } = useQuery(categoriesOptions());
  const categoryItems = useMemo(
    () => (categories ?? []).map((c) => ({ label: c.name, value: c.slug })),
    [categories],
  );
  const productColumns = useMemo(() => columns(t, categoryItems), [t, categoryItems]);

  return (
    <AppContent
      // Same title-row placement as the Users page: "New product" sits next to the heading, not in the table
      // toolbar, which now carries just the search box - Status and Category moved to their own columns.
      title={
        <div className="flex items-center justify-between">
          <h1 className="truncate text-xl font-semibold tracking-tight">{t('products')}</h1>
          <ButtonLink to="/admin/products/new">
            <Plus className="sm:-ms-1" />
            <span className="max-sm:sr-only">
              {t('newVar', { var: t('product').toLowerCase() })}
            </span>
          </ButtonLink>
        </div>
      }
      isPending={isLoading}
      fallback={<TablePageSkeleton />}
    >
      {productsPage && (
        <AllFeatureTable
          page={productsPage}
          columns={productColumns}
          actions={
            <DebouncedInput
              value={filter.filters.search ?? ''}
              onChange={(value) =>
                filter.setFilters({ search: value ? String(value) : undefined })
              }
              placeholder={`${t('search')}...`}
              startNode={<SearchIcon className="text-muted-foreground" />}
              className="w-48"
            />
          }
          getRowId={(row) => row.id}
          filter={filter}
        />
      )}
    </AppContent>
  );
}
