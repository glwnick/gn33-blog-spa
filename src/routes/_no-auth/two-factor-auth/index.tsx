import { createFileRoute } from '@tanstack/react-router';
import { ChevronLeftIcon } from 'lucide-react';
import { useAuth } from '@/context/auth-provider';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useTranslation } from '@/hooks/use-translation';
import { Spinner } from '@/components/ui/spinner';
import { ButtonLink } from '@/components/button-link';
import { twoFactorLogin } from '@/api/auth-api';
import Logo from '@/components/logo';
import { FieldDescription } from '@/components/ui/field';

import { HeaderAlert } from '@/components/header-alert';
import { useAlertMutation } from '@/hooks/use-alert-mutation';
import { OtpField } from '@/components/two-factor/otp-field';
import { TotpField } from '@/components/two-factor/totp-field';
import { isSafeRedirectTarget } from '@/lib/is-safe-redirect-target';

export const Route = createFileRoute('/_no-auth/two-factor-auth/')({
  component: TwoFactorAuth,
});

const twoFactorAuthLoginDescription = {
  TOTP: 'totpLoginDescription',
  OTP: 'otpLoginDescription',
  NONE: 'notPossible',
} as const;

function TwoFactorAuth() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const { t } = useTranslation();

  const { twoFactorData, login } = useAuth();

  const { token, type } = twoFactorData || { token: '', type: 'NONE' };

  const { mutate, isPending, alertError } = useAlertMutation({
    mutationFn: (code: string) => twoFactorLogin(token || '', code),
    onSuccess: (data) => {
      if (data.accessToken && data.user) {
        login({ accessToken: data.accessToken, user: data.user });

        // Defaults to /home, matching the plain-password path in routes/_no-auth/login. Defaulting to '/'
        // instead sent every two-factor user to the public landing page: '/' only bounces authenticated
        // visitors on to /home in its beforeLoad, and the router context is still the pre-login one on this
        // tick, so the bounce does not happen. The startsWith guard keeps a stale ?redirect back to this
        // page from looping. isSafeRedirectTarget (L7, SECURITY-AUDIT-2026-09-15.md) additionally requires
        // a root-relative path before honouring it at all.
        const redirectTo =
          isSafeRedirectTarget(search.redirect) && !search.redirect.startsWith(Route.to)
            ? search.redirect
            : '/home';
        navigate({ to: redirectTo });
      }
    },
  });

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <Logo />
        <div className="text-center">
          <CardTitle className="mb-2 font-bold text-2xl">
            {t('twoFactorAuth')}
          </CardTitle>
        </div>
        <HeaderAlert error={alertError} />
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <FieldDescription className="text-base">
            {t(twoFactorAuthLoginDescription[type])}
          </FieldDescription>
          <div className="flex justify-center">
            {type === 'TOTP' && <TotpField onComplete={mutate} />}
            {type === 'OTP' && <OtpField onComplete={mutate} />}
            {isPending && <Spinner className="size-12" />}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <ButtonLink to="/login" variant="outline">
          <ChevronLeftIcon className="size-5" />
          {t('back')}
        </ButtonLink>
      </CardFooter>
    </Card>
  );
}
