import type { ProductBadge as ProductBadgeType } from '@/schemas/products';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/use-translation';

/**
 * Maps the server-computed priority badge to the pixel spec: Last one = destructive, Seasonal / To order =
 * accent, Ready to ship = secondary/muted. There is no `Bestseller` case - see the backend `ProductBadge`
 * enum for why.
 */
export function ProductBadgeLabel({ badge }: { badge: ProductBadgeType | null }) {
  const { t } = useTranslation();

  if (badge === null) {
    return null;
  }

  switch (badge) {
    case 'LAST_ONE':
      return <Badge variant="destructive">{t('shopBadgeLastOne')}</Badge>;
    case 'SEASONAL':
      return <Badge variant="accent">{t('shopBadgeSeasonal')}</Badge>;
    case 'READY_TO_SHIP':
      return <Badge variant="secondary">{t('shopBadgeReadyToShip')}</Badge>;
    case 'TO_ORDER':
      return <Badge variant="accent">{t('shopBadgeToOrder')}</Badge>;
  }
}
