import { toast } from 'sonner';

import { revalidateLogic } from '@tanstack/react-form';
import { HeaderAlert } from '@/components/header-alert';
import { FieldGroup, FieldSet } from '@/components/ui/field';
import {
  changePasswordSchema,
  defaultChangePasswordInputValues,
} from '@/schemas/users';
import { useTranslation } from '@/hooks/use-translation';
import { changePassword } from '@/api/user-api';
import { useAppForm } from '@/hooks/use-form';
import { useAlertMutation } from '@/hooks/use-alert-mutation';

export const ChangePasswordForm = () => {
  const { t } = useTranslation();

  const cpForm = useAppForm({
    defaultValues: defaultChangePasswordInputValues,
    validators: {
      onDynamic: changePasswordSchema,
    },
    validationLogic: revalidateLogic(),
    onSubmit: (data) => {
      clearAlertError();
      changePasswordMutate(data.value);
    },
  });

  const {
    mutate: changePasswordMutate,
    alertError,
    clearAlertError,
  } = useAlertMutation({
    mutationFn: changePassword,
    onSuccess: (response) => {
      cpForm.reset();
      toast.success(response.message);
    },
  });

  return (
    <FieldGroup>
      <HeaderAlert error={alertError} fullDetails />
      <FieldSet>
        <cpForm.AppField
          name="currentPassword"
          children={(field) => (
            <field.TextField
              label={t('currentPassword')}
              mandatoryLabel
              type="password"
            />
          )}
        />
        <cpForm.AppField
          name="newPassword"
          children={(field) => (
            <field.PasswordField label={t('newPassword')} mandatoryLabel />
          )}
        />
        <cpForm.AppField
          name="confirmPassword"
          children={(field) => (
            <field.TextField
              label={t('confirmPassword')}
              mandatoryLabel
              type="password"
            />
          )}
        />
      </FieldSet>
      <cpForm.AppForm
        children={
          <cpForm.SubmitAndResetButtons
            submitLabel={t('save')}
            resetLabel={t('cancel')}
          />
        }
      />
    </FieldGroup>
  );
};
