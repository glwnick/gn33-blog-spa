import { createFileRoute } from '@tanstack/react-router';
import { AppContent } from '@/components/layout/app-content';
import { useAuth } from '@/context/auth-provider';
import { useTranslation } from '@/hooks/use-translation';

import { ChangePasswordCard } from '@/components/change-password-card';
import { TwoFactorSelector } from '@/components/two-factor/two-factor-selector';
import { FlexibleCards } from '@/components/layout/felxible-cards';
import { ProfileLayout } from '@/components/profile-layout';
import { ProfileLayoutSkeleton } from '@/components/profile-layout-skeleton';
import { prefetchProfileIdentity } from '@/components/profile-identity-card';
import { SSOSecurity } from '@/components/sign-in-type/sso-security';

export const Route = createFileRoute('/_auth/profile/security')({
  loader: ({ context }) =>
    prefetchProfileIdentity(context.queryClient, context.auth.user!.userId),
  component: Security,
});

function Security() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const isFormLogin = user?.signInType === 'FORM_LOGIN';

  return (
    <AppContent
      title={t('security')}
      isPending={!user}
      // Whether the real content is one card (SSOSecurity) or two (ChangePasswordCard + TwoFactorSelector, for
      // FORM_LOGIN) depends on `user.signInType`, which isn't known yet while this is showing - `user` is what
      // `isPending` is waiting on. A single card is the safe guess: an SSO account matches it exactly, and a
      // form-login account gains a second card once real content lands, which reads as content arriving rather
      // than the size-mismatch flicker a two-card guess would cause for every SSO account instead.
      fallback={
        <ProfileLayoutSkeleton cards={[{ width: 'w-80', height: 'h-44' }]} />
      }
    >
      <ProfileLayout>
        <FlexibleCards>
          {isFormLogin && <ChangePasswordCard />}
          {isFormLogin && <TwoFactorSelector type={user.twoFactorType} />}
          {!isFormLogin && <SSOSecurity type={user!.signInType} />}
        </FlexibleCards>
      </ProfileLayout>
    </AppContent>
  );
}
