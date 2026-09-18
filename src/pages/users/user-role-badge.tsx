import type { FC } from 'react';
import type { RoleFilter } from '@/schemas/users';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/use-translation';

const ROLE_LABEL_KEY = {
  ADMIN: 'userRoleAdmin',
  MANAGER: 'userRoleManager',
  USER: 'userRoleUser',
} as const;

/** The design handoff's outline Role chip on the Users table. */
export const UserRoleBadge: FC<{ readonly role: RoleFilter }> = ({ role }) => {
  const { t } = useTranslation();
  return <Badge variant="outline">{t(ROLE_LABEL_KEY[role])}</Badge>;
};
