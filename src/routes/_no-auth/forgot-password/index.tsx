import { createFileRoute } from '@tanstack/react-router';

import { revalidateLogic } from '@tanstack/react-form';
import { ChevronLeftIcon, MailIcon } from 'lucide-react';
import z from 'zod';
import { toast } from 'sonner';
import { FieldGroup, FieldSet } from '@/components/ui/field';
import { InputGroupAddon } from '@/components/ui/input-group';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

import { useTranslation } from '@/hooks/use-translation';
import { forgotPassword } from '@/api/auth-api';
import { emailSchema } from '@/schemas/common';
import Logo from '@/components/logo';
import { useAppForm } from '@/hooks/use-form';
import { HeaderAlert } from '@/components/header-alert';
import InputGroupField from '@/components/form/input-group-field';
import { ButtonLink } from '@/components/button-link';
import { useAlertMutation } from '@/hooks/use-alert-mutation';

export const Route = createFileRoute('/_no-auth/forgot-password/')({
  component: ForgotPassword,
});

const InputSchema = z.object({
  email: emailSchema,
});

const inputDefaultValues: z.infer<typeof InputSchema> = {
  email: '',
};

function ForgotPassword() {
  const { t } = useTranslation();

  const { mutate, isPending, alertError, clearAlertError } = useAlertMutation({
    mutationFn: forgotPassword,
    onSuccess: (data) => {
      toast.success(data.message);
    },
  });

  const forgotPasswordForm = useAppForm({
    defaultValues: inputDefaultValues,
    onSubmit: ({ value }) => {
      clearAlertError();
      mutate(value.email);
    },
    validators: {
      onDynamic: InputSchema,
    },
    validationLogic: revalidateLogic(),
  });

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <Logo />
        <div className="text-center">
          <CardTitle className="mb-2 font-bold text-2xl">
            {t('forgotPassword')}
          </CardTitle>
          <CardDescription className="text-base">
            {t('forgotPasswordDescription')}
          </CardDescription>
        </div>
        <HeaderAlert error={alertError} />
      </CardHeader>
      <CardContent className="w-full max-w-sm self-center">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            forgotPasswordForm.handleSubmit();
          }}
        >
          <FieldSet>
            <FieldGroup>
              <forgotPasswordForm.AppField
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
        <div className="grid mt-6">
          <Button
            onClick={forgotPasswordForm.handleSubmit}
            disabled={isPending}
          >
            {isPending ? <Spinner /> : t('send')}
          </Button>
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
