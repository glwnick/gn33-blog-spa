import { createFileRoute, redirect } from '@tanstack/react-router';
import { revalidateLogic } from '@tanstack/react-form';
import { ChevronLeftIcon } from 'lucide-react';
import z from 'zod';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useTranslation } from '@/hooks/use-translation';
import { FieldGroup, FieldSet } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { ButtonLink } from '@/components/button-link';
import { resetPassword } from '@/api/auth-api';

import Logo from '@/components/logo';

import { HeaderAlert } from '@/components/header-alert';
import { useAppForm } from '@/hooks/use-form';
import {
  defaultResetPasswordInputValues,
  resetPasswordSchema,
} from '@/schemas/auth';
import { useAlertMutation } from '@/hooks/use-alert-mutation';

export const Route = createFileRoute('/_no-auth/reset-password/')({
  validateSearch: z.object({
    resetToken: z.string(),
  }),
  beforeLoad: ({ search }) => {
    // Redirect authenticated users away from register
    if (!search.resetToken) {
      throw redirect({ to: '/forgot-password' });
    }
  },
  component: ResetPassword,
});

function ResetPassword() {
  const search = Route.useSearch();
  const token = search.resetToken;
  const { t } = useTranslation();

  const { mutate, isPending, alertError, clearAlertError } = useAlertMutation({
    mutationFn: resetPassword,
    onSuccess: (data) => {
      toast.success(data.message);
    },
  });

  const resetPasswordForm = useAppForm({
    defaultValues: defaultResetPasswordInputValues,
    onSubmit: ({ value }) => {
      clearAlertError();
      mutate({ token, newPassword: value.newPassword });
    },
    validators: {
      onDynamic: resetPasswordSchema,
    },
    validationLogic: revalidateLogic(),
  });

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <Logo />
        <div className="text-center">
          <CardTitle className="mb-2 font-bold text-2xl">
            {t('resetPassword')}
          </CardTitle>
        </div>
        <HeaderAlert error={alertError} />
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            resetPasswordForm.handleSubmit();
          }}
        >
          <FieldSet>
            <FieldGroup>
              <resetPasswordForm.AppField
                name="newPassword"
                children={(field) => (
                  <field.PasswordField
                    label={t('newPassword')}
                    mandatoryLabel
                  />
                )}
              />
              <resetPasswordForm.AppField
                name="confirmPassword"
                children={(field) => (
                  <field.TextField
                    label={t('confirmPassword')}
                    mandatoryLabel
                    type="password"
                  />
                )}
              />
            </FieldGroup>
          </FieldSet>
          <div className="grid mt-6">
            <Button type="submit" className="mt-6 w-full" disabled={isPending}>
              {isPending ? <Spinner /> : t('resetPassword')}
            </Button>
          </div>
        </form>
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
