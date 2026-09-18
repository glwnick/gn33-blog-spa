import { useQuery } from '@tanstack/react-query';
import {
  gendersOptions,
  languagesOptions,
  twoFactorTypesOptions,
} from '@/query-options/collection-options';
import { useAuth } from '@/context/auth-provider';

const MANAGER_ROLES = ['ROLE_MANAGER', 'ROLE_ADMIN'] as const;

/**
 * Returns true when the current user has manager or admin privileges - the mirror of the backend's
 * `RoleType.STAFF_ROLES` and the `_auth/_manager` route guard.
 *
 * <p>There is no separate staff check: INSTRUCTOR was the one role that made staff broader than manager, so with it
 * gone the two sets are identical. A shop role that widens staff again (order fulfilment, say) brings back both a
 * `useIsStaff` here and an `_auth/_staff` guard.
 */
export const useIsManager = () => {
  const { user } = useAuth();
  return (
    user?.roles.some((r) =>
      MANAGER_ROLES.includes(r as (typeof MANAGER_ROLES)[number]),
    ) ?? false
  );
};

/** Returns the list of gender options for select/combobox fields. */
export const useGenderCollection = () => {
  const { data } = useQuery(gendersOptions());
  return data;
};

/** Returns the list of two-factor authentication type options. */
export const useTwoFactorTypesCollection = () => {
  const { data } = useQuery(twoFactorTypesOptions());
  return data;
};

/** Returns the list of supported language options. */
export const useLanguagesCollection = () => {
  const { data } = useQuery(languagesOptions());
  return data;
};
