import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { FC } from 'react';
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from '@/components/ui/number-field';
import { adjustVariantStock } from '@/api/admin-products-api';
import { ADMIN_PRODUCT_KEY } from '@/query-options/admin-product-options';
import { PRODUCT_KEY } from '@/query-options/product-options';
import { useTranslation } from '@/hooks/use-translation';

type StockAdjustControlProps = {
  readonly variantId: string;
  readonly stock: number;
  readonly size?: 'sm' | 'default';
};

/**
 * "I finished two more today" must not require opening a form (plans/PLAN-catalogue-admin.md decision 16), so
 * this fires the row-locking endpoint directly on every change rather than batching into a form submit - the
 * same control embedded in both the admin product list and `product-variant-rows.tsx`.
 */
export const StockAdjustControl: FC<StockAdjustControlProps> = ({
  variantId,
  stock,
  size = 'default',
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [value, setValue] = useState(stock);

  // The server value can change under us (another tab, or this row's own product being reloaded) - stay in
  // sync whenever the caller's own `stock` prop moves, not just on first mount.
  useEffect(() => setValue(stock), [stock]);

  const { mutate } = useMutation({
    mutationFn: (newStock: number) => adjustVariantStock(variantId, newStock),
    onSuccess: () => {
      toast.success(t('actionSuccessfully'));
      queryClient.invalidateQueries({ queryKey: [ADMIN_PRODUCT_KEY] });
      queryClient.invalidateQueries({ queryKey: [PRODUCT_KEY] });
    },
    // Revert the optimistic local value on failure - a lost update or a validation error must not leave the
    // control quietly showing a number the server never accepted.
    onError: () => setValue(stock),
  });

  return (
    <NumberField
      value={value}
      min={0}
      size={size}
      onValueChange={(next) => {
        const resolved = next ?? 0;
        setValue(resolved);
        if (resolved !== stock) {
          mutate(resolved);
        }
      }}
    >
      <NumberFieldGroup>
        <NumberFieldDecrement aria-label={t('decrease')} />
        <NumberFieldInput className="w-12 text-center" aria-label={t('stock')} />
        <NumberFieldIncrement aria-label={t('increase')} />
      </NumberFieldGroup>
    </NumberField>
  );
};
