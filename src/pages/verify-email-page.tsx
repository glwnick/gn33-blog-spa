import { useEffect, useRef } from 'react';
import { revalidateLogic } from '@tanstack/react-form';
import { MailIcon } from 'lucide-react';
import z from 'zod';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FieldGroup, FieldSet } from '@/components/ui/field';
import { InputGroupAddon } from '@/components/ui/input-group';
import { useTranslation } from '@/hooks/use-translation';
import { Spinner } from '@/components/ui/spinner';
import { ButtonLink } from '@/components/button-link';
import { resendVerificationEmail, verifyEmail } from '@/api/auth-api';
import Logo from '@/components/logo';
import { HeaderAlert } from '@/components/header-alert';
import { useAlertMutation } from '@/hooks/use-alert-mutation';
import { useAppForm } from '@/hooks/use-form';
import InputGroupField from '@/components/form/input-group-field';
import { emailSchema } from '@/schemas/common';

const ResendInputSchema = z.object({ email: emailSchema });
const resendDefaultValues: z.infer<typeof ResendInputSchema> = { email: '' };

/**
 * M4, SECURITY-AUDIT-2026-09-15.md: the destination of the "Verify email address" link embedded in the
 * order-confirmation email a checkout-created account receives. No form for the redemption itself - the token
 * in the URL is the whole input, so verification fires automatically on mount rather than waiting for a
 * submit the page has no reason to ask for.
 */
export function VerifyEmailPage({ token }: { token: string | undefined }) {
  const { t } = useTranslation();
  // React 19 StrictMode double-invokes effects in development; without this guard that would redeem a
  // single-use token twice, and the second call would show a spurious "already used" error.
  const hasTriggeredRef = useRef(false);

  const { mutate, isPending, isSuccess, data, alertError } = useAlertMutation({
    mutationFn: verifyEmail,
  });

  // Recovery path for a lost/spam-filtered/expired link: the caller types the email back in and a fresh
  // token is sent, mirroring forgot-password's own enumeration-safe shape (always the same generic success,
  // regardless of whether the address needs one).
  const {
    mutate: resend,
    isPending: isResendPending,
    alertError: resendAlertError,
    clearAlertError: clearResendAlertError,
  } = useAlertMutation({
    mutationFn: resendVerificationEmail,
    onSuccess: (resendData) => toast.success(resendData.message),
  });

  const resendForm = useAppForm({
    defaultValues: resendDefaultValues,
    onSubmit: ({ value }) => {
      clearResendAlertError();
      resend(value.email);
    },
    validators: {
      onDynamic: ResendInputSchema,
    },
    validationLogic: revalidateLogic(),
  });

  useEffect(() => {
    if (token && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      mutate(token);
    }
  }, [token, mutate]);

  // No token to redeem in the first place, or redemption itself failed (expired/used/unknown token) - either
  // way, self-service resend is the only way forward from here.
  const showResend = !token || Boolean(alertError);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <Logo />
        <div className="text-center">
          <CardTitle className="mb-2 font-bold text-2xl">
            {t('verifyEmailTitle')}
          </CardTitle>
        </div>
        <HeaderAlert error={alertError} />
      </CardHeader>
      <CardContent className="text-center">
        {!token && <p>{t('verifyEmailInvalidLink')}</p>}
        {token && isPending && (
          <div className="flex flex-col items-center gap-4">
            <Spinner />
            <p>{t('verifyEmailPending')}</p>
          </div>
        )}
        {/* The backend's SuccessResponseDto.message is already localized server-side (the request carries
            Accept-Language), so it is shown directly rather than duplicated as a second translation key. */}
        {isSuccess && <p>{data.message}</p>}

        {showResend && (
          <div className="mx-auto mt-6 w-full max-w-sm text-left">
            <p className="mb-4 text-muted-foreground text-sm">
              {t('resendVerificationEmailDescription')}
            </p>
            <HeaderAlert error={resendAlertError} />
            <form
              onSubmit={(e) => {
                e.preventDefault();
                resendForm.handleSubmit();
              }}
            >
              <FieldSet>
                <FieldGroup>
                  <resendForm.AppField
                    name="email"
                    children={() => (
                      <InputGroupField
                        label={t('email')}
                        placeholder="myemail@example.com"
                        addons={
                          <InputGroupAddon>
                            <MailIcon />
                          </InputGroupAddon>
                        }
                        mandatoryLabel
                      />
                    )}
                  />
                </FieldGroup>
              </FieldSet>
            </form>
            <div className="mt-4 grid">
              <Button
                onClick={resendForm.handleSubmit}
                disabled={isResendPending}
              >
                {isResendPending ? <Spinner /> : t('resendVerificationEmail')}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <ButtonLink to="/login" className="w-full">
          {t('signIn')}
        </ButtonLink>
      </CardFooter>
    </Card>
  );
}
