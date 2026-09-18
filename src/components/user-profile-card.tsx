import { revalidateLogic } from '@tanstack/react-form';
import { useQueryClient } from '@tanstack/react-query';

import { toast } from 'sonner';
import type { UpdateUserInput, UserDetailsResponse } from '@/schemas/users';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldGroup, FieldSet } from '@/components/ui/field';
import { HeaderAlert } from '@/components/header-alert';
import { updateUserInputSchema } from '@/schemas/users';
import {
  useGenderCollection,
  useLanguagesCollection,
} from '@/hooks/use-collections';
import { updateProfile } from '@/api/user-api';
import { useLanguageAndFormat, useTranslation } from '@/hooks/use-translation';
import { useAppForm } from '@/hooks/use-form';
import { profileOptions } from '@/query-options/user-details';
import { useAlertMutation } from '@/hooks/use-alert-mutation';
import { formatPhoneNumber } from '@/lib/formatting';

type IUserProfileCardProps = {
  values: UserDetailsResponse;
};

export const UserProfileCard = ({ values }: IUserProfileCardProps) => {
  const genders = useGenderCollection();
  const languages = useLanguagesCollection();
  const queryClient = useQueryClient();

  const { t } = useTranslation();
  const { setLanguageAndFormat } = useLanguageAndFormat();

  const {
    mutate: updateProfileMutation,
    alertError,
    clearAlertError,
  } = useAlertMutation({
    mutationFn: async (myData: UpdateUserInput) => {
      await updateProfile(values.userId, myData);
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries(profileOptions(values.userId));
      setLanguageAndFormat(variables.preferredLanguage);
      toast.success(t('varUpdatedSuccessfully', { var: t('profile') }));
    },
  });

  const detailsForm = useAppForm({
    defaultValues: {
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      phoneNumber: formatPhoneNumber(values.phoneNumber),
      dateOfBirth: values.dateOfBirth,
      gender: values.gender || 'PREFER_NOT_TO_SAY',
      preferredLanguage: values.preferredLanguage,
    },
    validators: {
      onDynamic: updateUserInputSchema,
    },
    validationLogic: revalidateLogic(),
    onSubmit: (subData) => {
      updateProfileMutation(subData.value);
      clearAlertError();
    },
  });

  return (
    <Card className="h-fit w-full">
      <FieldSet>
        <CardHeader>
          <CardTitle>{t('details')}</CardTitle>
          <HeaderAlert error={alertError} />
        </CardHeader>
        <CardContent>
          <FieldGroup className="max-w-xl">
            <detailsForm.AppField
              name="email"
              children={(field) => (
                <field.TextField
                  label={t('email')}
                  type="email"
                  mandatoryLabel
                />
              )}
            />
            <detailsForm.AppField
              name="firstName"
              children={(field) => (
                <field.TextField label={t('firstName')} mandatoryLabel />
              )}
            />
            <detailsForm.AppField
              name="lastName"
              children={(field) => (
                <field.TextField label={t('lastName')} mandatoryLabel />
              )}
            />
            <detailsForm.AppField
              name="phoneNumber"
              children={(field) => (
                <field.PhoneField label={t('phoneNumber')} mandatoryLabel />
              )}
            />
            <detailsForm.AppField
              name="dateOfBirth"
              children={(field) => (
                <field.SingleDatePickerField
                  label={t('dateOfBirth')}
                  minDate={new Date(1950, 0, 1)}
                  maxDate={new Date()}
                />
              )}
            />
            <detailsForm.AppField
              name="gender"
              children={(field) => (
                <field.SelectField
                  label={t('gender')}
                  items={genders}
                  defaultValue={'PREFER_NOT_TO_SAY'}
                />
              )}
            />
            <detailsForm.AppField
              name="preferredLanguage"
              children={(field) => (
                <field.SelectField
                  label={t('preferredLanguage')}
                  items={languages}
                  defaultValue={'EN'}
                />
              )}
            />
            <detailsForm.AppForm
              children={
                <detailsForm.SubmitAndResetButtons
                  submitLabel={t('save')}
                  resetLabel={t('cancel')}
                />
              }
            />
          </FieldGroup>
        </CardContent>
      </FieldSet>
    </Card>
  );
};
