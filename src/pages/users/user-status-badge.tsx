import type { FC } from 'react';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/use-translation';

/**
 * Active/Blocked, straight off `UserEntity.enabled` - the same field `AccountStatusCard` already toggles
 * individually, just not previously surfaced as a table-wide badge. The design handoff also wants an
 * "Unverified" value; it didn't correspond to any persisted state when slice 7 shipped (see that plan's
 * conflict-resolution section), but M4 (SECURITY-AUDIT-2026-09-15.md) gave it a real one -
 * `UserEntity.emailVerified` - so it is shown here now. "Erase requested" still has no backing state and stays
 * dropped. Blocked takes priority over Unverified when both are true: an admin explicitly disabling the
 * account is the more actionable fact for staff scanning this column.
 */
export const UserStatusBadge: FC<{ readonly enabled: boolean; readonly emailVerified: boolean }> = ({
  enabled,
  emailVerified,
}) => {
  const { t } = useTranslation();
  if (!enabled) {
    return <Badge variant="destructive">{t('userStatusBlocked')}</Badge>;
  }
  if (!emailVerified) {
    return <Badge variant="secondary">{t('userStatusUnverified')}</Badge>;
  }
  return <Badge variant="accent">{t('userStatusActive')}</Badge>;
};
