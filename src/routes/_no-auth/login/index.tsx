import { Link, createFileRoute } from '@tanstack/react-router';

import { useState } from 'react';
import { EyeIcon, EyeOffIcon, LockIcon, MailIcon } from 'lucide-react';
import type { TranslationKey } from '@/hooks/use-translation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';

import { Spinner } from '@/components/ui/spinner';
import { InputGroupAddon, InputGroupButton } from '@/components/ui/input-group';
import { useTranslation } from '@/hooks/use-translation';
import { loginUser } from '@/api/auth-api';
import { useAuth } from '@/context/auth-provider';
import Logo from '@/components/logo';
import { defaultLoginInputValues, loginInputSchema } from '@/schemas/auth';
import InputGroupField from '@/components/form/input-group-field';
import { useAppForm } from '@/hooks/use-form';
import { useAlertMutation } from '@/hooks/use-alert-mutation';
import { HeaderAlert } from '@/components/header-alert';
import { ApiResponseError } from '@/lib/api-error';
import { SSOProviders } from '@/components/sign-in-type/sso-providers';

export const Route = createFileRoute('/_no-auth/login/')({
  component: LoginPage,
});

// Codes emitted by the backend's OAuth2 success handler when it refuses to issue a session. Anything
// unrecognized still surfaces something actionable rather than silently bouncing the member back here.
const SSO_ERROR_MESSAGES: Record<string, TranslationKey> = {
  'profile-incomplete': 'ssoErrorProfileIncomplete',
  'account-mismatch': 'ssoErrorAccountMismatch',
  'account-unavailable': 'ssoErrorAccountUnavailable',
};

function LoginPage() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();

  const { login, twoFactorLogin } = useAuth();
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);

  const ssoErrorMessage = search.ssoError
    ? t(SSO_ERROR_MESSAGES[search.ssoError] ?? 'ssoErrorGeneric')
    : null;

  const { mutate, isPending, alertError } = useAlertMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      if (data.twoFactorToken && data.twoFactorType) {
        twoFactorLogin({
          token: data.twoFactorToken,
          type: data.twoFactorType,
        });
        navigate({
          to: '/two-factor-auth',
          search: search,
        });
      }
      if (data.accessToken && data.user) {
        login({ accessToken: data.accessToken, user: data.user });
        navigate({ to: search.redirect || '/home' });
      }
    },
    meta: {
      skipGlobalErrorToast: true,
    },
  });

  const loginForm = useAppForm({
    defaultValues: defaultLoginInputValues,
    onSubmit: ({ value }) => {
      mutate(value);
    },
    validators: {
      onSubmit: loginInputSchema,
    },
  });

  return (
    // The handoff's 400px focal column, with the mark and the heading *above* the card rather than inside it:
    // screen 12 leads with a 44px logo and a titled sub-line, then a plain `p-5` card that is only the form.
    <div className="flex w-full max-w-[400px] flex-col gap-5">
      <div className="flex flex-col items-center gap-2 text-center">
        <Logo logoClassName="size-11" />
        <div className="flex flex-col gap-1">
          <h1 className="text-[22px] font-semibold tracking-tight">{t('loginTitle')}</h1>
          <p className="text-sm text-muted-foreground">{t('loginSubtitle')}</p>
        </div>
      </div>

      <Card className="w-full py-5">
      <CardHeader className="px-5 pb-0">
        <HeaderAlert
          error={
            alertError
              ? new ApiResponseError(
                  alertError.message === 'Bad credentials'
                    ? t('badCredentials')
                    : alertError.message,
                  alertError.status,
                  { ...alertError },
                )
              : ssoErrorMessage
                ? new ApiResponseError(ssoErrorMessage, 401)
                : null
          }
          fullDetails={false}
        />
      </CardHeader>
      {/* 36px fields, not the app-wide 32: this is a standalone focal form, per the handoff's own note. */}
      <CardContent className="px-5 [&_[data-slot=input-group]]:h-9">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            loginForm.handleSubmit();
          }}
        >
          <FieldSet>
            <FieldGroup>
              <loginForm.AppField
                name="email"
                children={() => (
                  <InputGroupField
                    label={t('email')}
                    type="text"
                    addons={
                      <InputGroupAddon>
                        <MailIcon />
                      </InputGroupAddon>
                    }
                  />
                )}
              />
              <loginForm.AppField
                name="password"
                children={() => (
                  <InputGroupField
                    label={
                      <div className="flex justify-between">
                        <FieldLabel htmlFor="password">
                          {t('password')}
                        </FieldLabel>
                        <Link
                          to="/forgot-password"
                          tabIndex={-1}
                          className="text-muted-foreground underline-offset-4 hover:underline hover:text-accent-foreground"
                        >
                          {t('forgotPassword')}
                        </Link>
                      </div>
                    }
                    type={showPassword ? 'text' : 'password'}
                    addons={
                      <>
                        <InputGroupAddon>
                          <LockIcon />
                        </InputGroupAddon>
                        <InputGroupAddon align="inline-end">
                          <InputGroupButton
                            size="icon-xs"
                            onClick={() => {
                              setShowPassword((prev) => !prev);
                            }}
                            tabIndex={-1}
                          >
                            {showPassword ? <EyeIcon /> : <EyeOffIcon />}
                          </InputGroupButton>
                        </InputGroupAddon>
                      </>
                    }
                  />
                )}
              />
            </FieldGroup>
          </FieldSet>
          {/* 38px, per screen 12 - taller than the app's default button because it is this page's one action. */}
          <Button type="submit" className="mt-6 h-9.5 w-full" disabled={isPending}>
            {isPending ? <Spinner /> : t('signIn')}
          </Button>
        </form>
        <SSOProviders />
      </CardContent>
      </Card>

      {/* Below the card, not in a `CardFooter`: that slot renders a bordered `bg-muted/50` strip, which would
          box in a line that screen 12 has sitting free under the form. */}
      <div className="flex justify-center gap-2 text-center text-sm">
        <span>{t('noAccount')}</span>
        <Link to="/register" className="font-semibold underline-offset-4 hover:underline">
          {t('register')}
        </Link>
      </div>
    </div>
  );
}
