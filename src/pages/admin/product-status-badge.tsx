import type { FC } from 'react';
import type { ProductStatus } from '@/schemas/products';
import type { TranslationKey } from '@/hooks/use-translation';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/use-translation';

/** Alongside `order-status-badge.tsx`. An exhaustive switch (no `default`) so a future status fails typecheck. */
const STATUS_VARIANT: Record<ProductStatus, 'outline' | 'default' | 'secondary'> = {
  DRAFT: 'outline',
  ACTIVE: 'default',
  ARCHIVED: 'secondary',
};

export const STATUS_LABEL_KEY: Record<ProductStatus, TranslationKey> = {
  DRAFT: 'productStatusDraft',
  ACTIVE: 'productStatusActive',
  ARCHIVED: 'productStatusArchived',
};

export const ProductStatusBadge: FC<{ readonly status: ProductStatus }> = ({ status }) => {
  const { t } = useTranslation();
  return <Badge variant={STATUS_VARIANT[status]}>{t(STATUS_LABEL_KEY[status])}</Badge>;
};
