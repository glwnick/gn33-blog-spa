import { revalidateLogic } from '@tanstack/react-form';
import { toast } from 'sonner';
import type { UpdateUserInput, UserDetailsResponse } from '@/schemas/users';
import { updateUserInputSchema } from '@/schemas/users';
import {
  useGenderCollection,
  useLanguagesCollection,
} from '@/hooks/use-collections';
import { useTranslation } from '@/hooks/use-translation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

import { HeaderAlert } from '@/components/header-alert';
import { FieldGroup, FieldLegend, FieldSet } from '@/components/ui/field';

import { formatPhoneNumber } from '@/lib/formatting';

import { useAppForm } from '@/hooks/use-form';
import { UserAvatar } from '@/components/user-avatar';
import { Separator } from '@/components/ui/separator';
import { useAlertMutation } from '@/hooks/use-alert-mutation';

type UserFormProps = {
  values: UserDetailsResponse;
  onSubmitAction: (input: Readonly<UpdateUserInput>) => Promise<void>;
  onSuccessMessage?: string;
  onSuccessAction?: () => void;
  readOnly?: boolean;
};

function UserForm({
  values,
  onSubmitAction,
  onSuccessMessage = 'Saved successfully',
  onSuccessAction,
  readOnly = false,
}: Readonly<UserFormProps>) {
  const genders = useGenderCollection();
  const languages = useLanguagesCollection();
  const { t } = useTranslation();

  const form = useAppForm({
    defaultValues: {
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      phoneNumber: formatPhoneNumber(values.phoneNumber),
      preferredLanguage: values.preferredLanguage,
      gender: values.gender || 'PREFER_NOT_TO_SAY',
      dateOfBirth: values.dateOfBirth,
    },
    validators: { onDynamic: updateUserInputSchema },
    validationLogic: revalidateLogic(),
    onSubmit: (sub) => {
      updateUserProfileMutation(sub.value);
      clearAlertError();
    },
  });

  const {
    mutate: updateUserProfileMutation,
    alertError,
    clearAlertError,
  } = useAlertMutation({
    mutationFn: async (myData: UpdateUserInput) => {
      await onSubmitAction(myData);
    },
    onSuccess: () => {
      toast.success(onSuccessMessage);
      onSuccessAction?.();
    },
  });

  return (
    <Card className="max-w-sm h-fit w-full">
      <CardHeader>
        <FieldLegend>{t('avatar')}</FieldLegend>
        <UserAvatar
          userId={values.userId}
          profilePictureUrl={values.profilePictureUrl}
        />
        <Separator className="my-4" />
        <FieldLegend>{t('profile')}</FieldLegend>
        <HeaderAlert error={alertError} />
      </CardHeader>
      <CardContent>
        <FieldSet disabled={readOnly}>
          <FieldGroup>
            <form.AppField
              name="email"
              children={(field) => (
                <field.TextField
                  label={t('email')}
                  type="email"
                  mandatoryLabel
                />
              )}
            />
            <form.AppField
              name="firstName"
              children={(field) => (
                <field.TextField label={t('firstName')} mandatoryLabel />
              )}
            />
            <form.AppField
              name="lastName"
              children={(field) => (
                <field.TextField label={t('lastName')} mandatoryLabel />
              )}
            />
            <form.AppField
              name="phoneNumber"
              children={(field) => (
                <field.PhoneField label={t('phoneNumber')} mandatoryLabel />
              )}
            />
            <form.AppField
              name="dateOfBirth"
              children={(field) => (
                <field.SingleDatePickerField
                  label={t('dateOfBirth')}
                  minDate={new Date(1950, 0, 1)}
                  maxDate={new Date()}
                />
              )}
            />
            <form.AppField
              name="gender"
              children={(field) => (
                <field.SelectField
                  label={t('gender')}
                  items={genders}
                  defaultValue={'PREFER_NOT_TO_SAY'}
                />
              )}
            />
            <form.AppField
              name="preferredLanguage"
              children={(field) => (
                <field.SelectField
                  label={t('preferredLanguage')}
                  items={languages}
                  defaultValue={'EN'}
                />
              )}
            />
          </FieldGroup>
          {!readOnly && (
            <form.AppForm
              children={
                <form.SubmitAndResetButtons
                  submitLabel={t('save')}
                  resetLabel={t('cancel')}
                />
              }
            />
          )}
        </FieldSet>
      </CardContent>
    </Card>
  );
}

export default UserForm;
