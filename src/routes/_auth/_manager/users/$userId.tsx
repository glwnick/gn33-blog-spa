import { useQuery } from '@tanstack/react-query';
import { Link, createFileRoute } from '@tanstack/react-router';
import { AppContent } from '@/components/layout/app-content';
import { useTranslation } from '@/hooks/use-translation';
import UserForm from '@/pages/users/user-form';
import { updateProfile } from '@/api/user-api';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { UserRoleCard } from '@/components/user-role-card';
import { AccountStatusCard } from '@/pages/users/account-status-card';
import { GdprEraseCard } from '@/pages/users/gdpr-erase-card';
import { FlexibleCards } from '@/components/layout/felxible-cards';
import { FlexibleCardsSkeleton } from '@/components/layout/flexible-cards-skeleton';
import { userOptions } from '@/query-options/user-options';
import { useAuth } from '@/context/auth-provider';

export const Route = createFileRoute('/_auth/_manager/users/$userId')({
  component: UserDetails,
});

function UserDetailBreadcrumbs() {
  const { t } = useTranslation();
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="text-xl">
          <BreadcrumbLink render={<Link to="..">{t('users')}</Link>} />
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage className="text-xl font-semibold">
            {t('userDetails')}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function UserDetails() {
  const { t } = useTranslation();
  const { userId } = Route.useParams();
  const { user } = useAuth();
  const isAdmin = user?.roles.includes('ROLE_ADMIN') ?? false;

  const { data, isLoading } = useQuery(userOptions(userId));

  return (
    <AppContent
      title={<UserDetailBreadcrumbs />}
      isPending={isLoading}
      fallback={
        <FlexibleCardsSkeleton
          cards={[
            { width: 'w-full max-w-lg', height: 'h-96' },
            { width: 'w-72', height: 'h-32' },
            { width: 'w-72', height: 'h-40' },
            { width: 'w-72', height: 'h-40' },
          ]}
        />
      }
    >
      {data && (
        <FlexibleCards>
          <UserForm
            values={data}
            onSubmitAction={async (v) => updateProfile(userId, v)}
            onSuccessMessage={t('varUpdatedSuccessfully', { var: t('users') })}
            readOnly={!isAdmin}
          />
          {isAdmin && <UserRoleCard userId={userId} />}
          <AccountStatusCard userId={userId} />
          <GdprEraseCard userId={userId} />
        </FlexibleCards>
      )}
    </AppContent>
  );
}
