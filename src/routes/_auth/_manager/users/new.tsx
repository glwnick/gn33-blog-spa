import { Link, createFileRoute, redirect } from '@tanstack/react-router';

import { revalidateLogic } from '@tanstack/react-form';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import type { CreateUserInput } from '@/schemas/users';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { createUser } from '@/api/user-api';
import { useTranslation } from '@/hooks/use-translation';

import { AppContent } from '@/components/layout/app-content';

import {
  useGenderCollection,
  useLanguagesCollection,
} from '@/hooks/use-collections';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

import { HeaderAlert } from '@/components/header-alert';
import { FieldGroup, FieldLegend, FieldSet } from '@/components/ui/field';

import { useAppForm } from '@/hooks/use-form';
import {
  createUserInputSchema,
  defaultCreateUserInputValues,
} from '@/schemas/users';
import { USER_KEY } from '@/query-options/user-options';
import { useAlertMutation } from '@/hooks/use-alert-mutation';

export const Route = createFileRoute('/_auth/_manager/users/new')({
  // User creation is ADMIN-only; the "new user" button is already hidden for
  // managers, but the route itself must also reject a direct URL visit.
  beforeLoad: ({ context }) => {
    if (!context.auth.user?.roles.includes('ROLE_ADMIN')) {
      throw redirect({ to: '/users' });
    }
  },
  component: NewUser,
});

function NewUserBreadcrumbs() {
  const { t } = useTranslation();
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="text-xl">
          <BreadcrumbLink render={<Link to="..">{t('users')}</Link>} />
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage className="text-xl font-semibold">
            {t('newVar', { var: t('user').toLowerCase() })}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function NewUser() {
  const { t } = useTranslation();
  const genders = useGenderCollection();
  const languages = useLanguagesCollection();
  const navigate = Route.useNavigate();
  const queryClient = useQueryClient();

  const form = useAppForm({
    defaultValues: defaultCreateUserInputValues,
    validators: { onDynamic: createUserInputSchema },
    validationLogic: revalidateLogic(),
    onSubmit: (sub) => {
      clearAlertError();
      createUserMutation(sub.value);
    },
  });

  const {
    mutate: createUserMutation,
    alertError,
    clearAlertError,
  } = useAlertMutation({
    mutationFn: async (myData: CreateUserInput) => {
      const res = await createUser(myData);
      return res;
    },
    onSuccess: (res) => {
      toast.success(t('actionSuccessfully'));
      queryClient.invalidateQueries({ queryKey: [USER_KEY] });
      navigate({ to: `/users/${res.objectId}` });
    },
  });

  return (
    <AppContent title={<NewUserBreadcrumbs />} isPending={false}>
      <Card className="max-w-sm h-fit min-w-sm w-full">
        <CardHeader>
          <FieldLegend>{t('profile')}</FieldLegend>
          <HeaderAlert error={alertError} />
        </CardHeader>
        <CardContent>
          <FieldSet>
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
                name="password"
                children={(field) => (
                  <field.PasswordField label={t('password')} mandatoryLabel />
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
            <form.AppForm
              children={
                <form.SubmitAndResetButtons
                  submitLabel={t('create')}
                  resetLabel={t('cancel')}
                />
              }
            />
          </FieldSet>
        </CardContent>
      </Card>
    </AppContent>
  );
}
