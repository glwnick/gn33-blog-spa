import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { SearchIcon, UserPlus } from 'lucide-react';
import { useMemo } from 'react';

import type { UserListFilters } from '@/schemas/users';
import { AppContent } from '@/components/layout/app-content';

import { columns } from '@/pages/users/columns';
import { UserStatsCards } from '@/pages/users/user-stats-cards';
import { usersOptions } from '@/query-options/user-options';
import { useFilters } from '@/hooks/use-filters';
import { ButtonLink } from '@/components/button-link';
import { DebouncedInput } from '@/components/debounce-input';
import { useTranslation } from '@/hooks/use-translation';

import { AllFeatureTable } from '@/components/data-table/all-feature-table';
import { TablePageSkeleton } from '@/components/data-table/table-page-skeleton';
import { userFiltersSchema } from '@/schemas/users';
import { useAuth } from '@/context/auth-provider';

export const Route = createFileRoute('/_auth/_manager/users/')({
  component: Users,
  validateSearch: (search) =>
    userFiltersSchema.parse(search) as UserListFilters,
});

function Users() {
  const { t } = useTranslation();
  const filter = useFilters(Route.id);
  const { data: usersPage, isLoading } = useQuery(usersOptions(filter.filters));
  const { user } = useAuth();
  const isAdmin = user?.roles.includes('ROLE_ADMIN') ?? false;
  const userColumns = useMemo(() => columns({ t }), [t]);

  return (
    <AppContent
      // The design handoff's title row: "Users" on the left, "New user" on the right - not in the table
      // toolbar, which the design keeps to just search plus the Role/Status column filters.
      title={
        <div className="flex items-center justify-between">
          <h1 className="truncate text-xl font-semibold tracking-tight">{t('users')}</h1>
          {isAdmin && (
            <ButtonLink to="/users/new">
              <UserPlus className="sm:-ms-1" />
              <span className="max-sm:sr-only">
                {t('newVar', { var: t('user').toLowerCase() })}
              </span>
            </ButtonLink>
          )}
        </div>
      }
      isPending={isLoading}
      fallback={
        <div className="flex flex-col gap-4">
          <UserStatsCards />
          <TablePageSkeleton />
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <UserStatsCards />
        <AllFeatureTable
          page={usersPage!}
          columns={userColumns}
          actions={
            <DebouncedInput
              value={filter.filters.search ?? ''}
              onChange={(value) =>
                filter.setFilters({ search: value ? String(value) : undefined })
              }
              placeholder={t('userSearchPlaceholder')}
              startNode={<SearchIcon className="text-muted-foreground" />}
              className="w-56"
            />
          }
          getRowId={(row) => row.userId}
          filter={filter}
          initialColumnVisibility={{ createdDate: true }}
        />
      </div>
    </AppContent>
  );
}
