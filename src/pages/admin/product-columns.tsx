import { useNavigate } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Copy, SquarePen, Trash2 } from 'lucide-react';
import type { AppColumnDef } from '@/components/data-table/table-features';
import type { AdminProductSummary } from '@/schemas/admin-products';
import type { SelectOptionContentItem } from '@/query-options/collection-options';
import {
  deleteAdminProduct,
  duplicateAdminProduct,
  updateAdminProductFeatured,
} from '@/api/admin-products-api';
import { ADMIN_PRODUCT_KEY } from '@/query-options/admin-product-options';
import { PRODUCT_KEY } from '@/query-options/product-options';
import { productImageSrc } from '@/lib/product-image-src';
import { ColumnHeader } from '@/components/data-table/column-header';
import { COLUMN_ACTIONS } from '@/components/data-table/constants';
import { RowButtons } from '@/components/data-table/row-buttons';
import { AlertDialogDestructive } from '@/components/alert-dialog-destructive';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ProductStatusBadge, STATUS_LABEL_KEY } from '@/pages/admin/product-status-badge';
import { StockAdjustControl } from '@/pages/admin/stock-adjust-control';
import { useTranslation } from '@/hooks/use-translation';
import { formatDateTime, formatPrice } from '@/lib/formatting';

const statusFilterOptions = (
  t: ReturnType<typeof useTranslation>['t'],
): Array<SelectOptionContentItem> =>
  (['DRAFT', 'ACTIVE', 'ARCHIVED'] as const).map((status) => ({
    label: t(STATUS_LABEL_KEY[status]),
    value: status,
  }));

function useInvalidateProductCaches() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: [ADMIN_PRODUCT_KEY] });
    queryClient.invalidateQueries({ queryKey: [PRODUCT_KEY] });
  };
}

function FeaturedToggleCell({ product }: { readonly product: AdminProductSummary }) {
  const { t } = useTranslation();
  const invalidate = useInvalidateProductCaches();
  const { mutate, isPending } = useMutation({
    mutationFn: (featured: boolean) =>
      updateAdminProductFeatured(product.id, featured),
    onSuccess: () => {
      toast.success(t('actionSuccessfully'));
      invalidate();
    },
  });

  return (
    <Switch
      checked={product.featured}
      disabled={isPending}
      aria-label={t('adminProductFeatured')}
      onCheckedChange={(checked) => mutate(checked)}
    />
  );
}

export const columns = (
  t: ReturnType<typeof useTranslation>['t'],
  categoryItems: Array<SelectOptionContentItem>,
): Array<AppColumnDef<AdminProductSummary>> => [
  {
    accessorKey: 'primaryImageUrl',
    header: () => null,
    enableSorting: false,
    // The header itself is deliberately blank (a thumbnail needs no title), but the View menu's toggle
    // still needs a real label - see `data-table.d.ts`'s `meta.label`.
    meta: { label: t('image') },
    cell: ({ row }) => (
      <div className="size-12 shrink-0 overflow-hidden rounded-md bg-muted">
        {row.original.primaryImageUrl && (
          <img
            src={productImageSrc(row.original.primaryImageUrl)}
            alt=""
            className="size-full object-cover"
          />
        )}
      </div>
    ),
  },
  {
    accessorKey: 'name',
    header: ({ column }) => <ColumnHeader column={column} title={t('name')} />,
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.name}</span>
        <span className="text-xs text-muted-foreground">{row.original.slug}</span>
      </div>
    ),
  },
  {
    // `categories` is the real response field (an array, batched server-side - see
    // `AdminProductServiceImpl.listProducts`), but the filter itself is a single category slug
    // (`AdminProductFilterDto.category`), so `filterKey` points at a key with no matching shape of its own -
    // `data-table.d.ts` widens `ColumnMeta.filterKey` to allow that. Not sortable for the same batching
    // reason `variantCount`/`totalStock`/`minPrice` below aren't - a many-to-many, and multi-valued besides,
    // so there is no single value a sort order could compare.
    accessorKey: 'categories',
    header: ({ column }) => <ColumnHeader column={column} title={t('shopCategory')} />,
    enableSorting: false,
    meta: {
      label: t('shopCategory'),
      filterKey: 'category',
      filterVariant: 'select',
      filterOptions: categoryItems,
    },
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.categories.map((category) => (
          <Badge key={category.id} variant="outline">
            {category.name}
          </Badge>
        ))}
      </div>
    ),
  },
  {
    // Default (no selection) hides ARCHIVED - `AdminProductServiceImpl.listProducts` treats an absent
    // `status` param that way - so "Cancel" here isn't quite "no filter", it's "back to that default".
    accessorKey: 'status',
    header: ({ column }) => <ColumnHeader column={column} title={t('status')} />,
    meta: {
      label: t('status'),
      filterKey: 'status',
      filterVariant: 'select',
      filterOptions: statusFilterOptions(t),
    },
    cell: ({ row }) => <ProductStatusBadge status={row.original.status} />,
  },
  {
    accessorKey: 'featured',
    header: ({ column }) => <ColumnHeader column={column} title={t('adminProductFeatured')} />,
    meta: { label: t('adminProductFeatured') },
    cell: ({ row }) => <FeaturedToggleCell product={row.original} />,
  },
  {
    // Not sortable, like `totalStock`/`minPrice` below and Users' `orderCount`/`lifetimeTotal`: this is
    // batched in from `ProductVariantRepository.aggregateByProductIds` after the product page is already
    // fixed, so there is no `ProductEntity` property `AdminProductServiceImpl.resolveSort` could sort by.
    accessorKey: 'variantCount',
    header: ({ column }) => <ColumnHeader column={column} title={t('adminProductVariants')} />,
    enableSorting: false,
    meta: { label: t('adminProductVariants') },
    cell: ({ row }) => (
      <div className="text-right tabular-nums">{row.original.variantCount}</div>
    ),
  },
  {
    // Same reasoning as `variantCount` above.
    accessorKey: 'totalStock',
    header: ({ column }) => <ColumnHeader column={column} title={t('stock')} />,
    enableSorting: false,
    meta: { label: t('stock') },
    // A multi-variant product has no single variant the control could mean (decision 16) - it falls back to a
    // plain read-only number, and adjusting any one variant's stock happens from the edit form instead.
    cell: ({ row }) =>
      row.original.soleVariantId ? (
        <StockAdjustControl
          variantId={row.original.soleVariantId}
          stock={row.original.totalStock}
          size="sm"
        />
      ) : (
        <div className="text-right tabular-nums">{row.original.totalStock}</div>
      ),
  },
  {
    // Same reasoning as `variantCount` above - `minPrice` is `MIN(variant.price)`, not a product column.
    accessorKey: 'minPrice',
    header: ({ column }) => <ColumnHeader column={column} title={t('shopPrice')} />,
    enableSorting: false,
    meta: { label: t('shopPrice') },
    cell: ({ row }) => (
      <div className="text-right tabular-nums">
        {row.original.minPrice === null ? '—' : formatPrice(row.original.minPrice)}
      </div>
    ),
  },
  {
    accessorKey: 'updatedAt',
    header: ({ column }) => <ColumnHeader column={column} title={t('lastModifiedDate')} />,
    meta: { label: t('lastModifiedDate') },
    cell: ({ row }) => formatDateTime(row.original.updatedAt),
  },
  {
    id: COLUMN_ACTIONS,
    cell: ({ row }) => {
      const product = row.original;
      const navigate = useNavigate();
      const invalidate = useInvalidateProductCaches();

      const { mutate: duplicateMutation } = useMutation({
        mutationFn: () => duplicateAdminProduct(product.id),
        onSuccess: (res) => {
          toast.success(t('varCreatedSuccessfully', { var: t('product') }));
          invalidate();
          navigate({ to: `/admin/products/${res.objectId}` });
        },
      });

      const { mutate: deleteMutation } = useMutation({
        mutationFn: () => deleteAdminProduct(product.id),
        onSuccess: () => {
          toast.success(t('actionSuccessfully'));
          invalidate();
        },
      });

      const buttons = [
        <Button
          variant="secondary"
          aria-label={t('editVar', { var: t('product').toLowerCase() })}
          onClick={() => navigate({ to: `/admin/products/${product.id}` })}
        >
          <SquarePen />
        </Button>,
        <Button
          variant="secondary"
          aria-label={t('adminProductDuplicate')}
          onClick={() => duplicateMutation()}
        >
          <Copy />
        </Button>,
      ];

      // A published product can never be deleted outright (decision 19) - DRAFT is the reliable client-side
      // signal for "worth offering the button", even though the rare DRAFT-but-previously-published edge case
      // still gets a clear refusal toast from the backend rather than a silently broken action.
      if (product.status === 'DRAFT') {
        buttons.push(
          <AlertDialogDestructive
            buttonContent={<Trash2 />}
            title={t('deleteVar', { var1: t('product').toLowerCase(), var2: product.name })}
            description={t('deleteVarDescription', { var: t('product') })}
            action={() => deleteMutation()}
          />,
        );
      }

      return <RowButtons buttons={buttons} />;
    },
  },
];
