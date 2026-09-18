import { queryOptions } from '@tanstack/react-query';
import { getRoles, getUserRoles } from '@/api/role-api';
import { getStoredLanguage } from '@/lib/i18n';

export const rolesOptions = () => {
  return queryOptions({
    queryKey: ['roles', getStoredLanguage()],
    queryFn: getRoles,
    staleTime: Infinity,
  });
};

export const userRolesOptions = (userId: string) => {
  return queryOptions({
    queryKey: ['users', userId, 'roles', getStoredLanguage()],
    queryFn: () => getUserRoles(userId),
    staleTime: Infinity,
    select: (data) => data.map((r) => r.roleId),
  });
};
