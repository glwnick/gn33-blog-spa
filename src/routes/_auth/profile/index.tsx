import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useAuth } from '@/context/auth-provider';
import { UserProfileCard } from '@/components/user-profile-card';
import { PushNotificationsCard } from '@/components/push-notifications-card';
import { NotificationPreferencesCard } from '@/components/notification-preferences-card';
import { WhatsAppVerificationCard } from '@/components/whatsapp-verification-card';
import { ProfileSecurityDataCard } from '@/components/profile-security-data-card';
import { ProfileLayout } from '@/components/profile-layout';
import { ProfileLayoutSkeleton } from '@/components/profile-layout-skeleton';
import { prefetchProfileIdentity } from '@/components/profile-identity-card';
import { FlexibleCards } from '@/components/layout/felxible-cards';
import { profileOptions } from '@/query-options/user-details';
import { AppContent } from '@/components/layout/app-content';
import { useTranslation } from '@/hooks/use-translation';

export const Route = createFileRoute('/_auth/profile/')({
  loader: ({ context }) =>
    prefetchProfileIdentity(context.queryClient, context.auth.user!.userId),
  component: Profile,
});

function Profile() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const { data, isPending, isError, error } = useQuery(
    profileOptions(user!.userId),
  );

  if (isError) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <AppContent
      title={t('profile')}
      isPending={isPending}
      fallback={
        <ProfileLayoutSkeleton
          cards={[
            { width: 'w-full max-w-md', height: 'h-64' },
            { width: 'w-56', height: 'h-24' },
            { width: 'w-56', height: 'h-24' },
            { width: 'w-56', height: 'h-24' },
            { width: 'w-56', height: 'h-24' },
          ]}
        />
      }
    >
      <ProfileLayout>
        <UserProfileCard values={data!} />
        <FlexibleCards>
          <NotificationPreferencesCard />
          <PushNotificationsCard />
          <WhatsAppVerificationCard />
          <ProfileSecurityDataCard />
        </FlexibleCards>
      </ProfileLayout>
    </AppContent>
  );
}
