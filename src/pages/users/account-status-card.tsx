import { revalidateLogic } from '@tanstack/react-form';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { FC } from 'react';
import type { AccountStatusInput } from '@/schemas/users';
import { accountStatusInputSchema } from '@/schemas/users';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HeaderAlert } from '@/components/header-alert';
import { FieldDescription, FieldGroup, FieldSet } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { updateAccountStatus } from '@/api/user-api';
import { useTranslation } from '@/hooks/use-translation';
import { useAppForm } from '@/hooks/use-form';
import { useAlertMutation } from '@/hooks/use-alert-mutation';
import { USER_KEY, userOptions } from '@/query-options/user-options';
import { useAuth } from '@/context/auth-provider';
import { formatDate, toIsoDate } from '@/lib/formatting';

type AccountStatusCardProps = {
  readonly userId: string;
};

/**
 * Card that lets an ADMIN or MANAGER enable/disable a member's account and set or
 * clear its access expiry date. A manager may not manage a privileged (ADMIN or
 * MANAGER) account, so the card hides itself in that case; the backend enforces
 * the same rule regardless.
 */
export const AccountStatusCard: FC<AccountStatusCardProps> = ({ userId }) => {
  const { data: userDetails } = useQuery(userOptions(userId));
  const { user } = useAuth();
  const isAdmin = user?.roles.includes('ROLE_ADMIN') ?? false;

  if (!userDetails) return null;

  // Nobody may change their own account status; the backend rejects it, so hide the card.
  if (user?.userId === userId) return null;

  const targetIsPrivileged =
    userDetails.userRoleType === 'ADMIN' ||
    userDetails.userRoleType === 'MANAGER';
  if (!isAdmin && targetIsPrivileged) return null;

  return (
    <AccountStatusForm
      userId={userId}
      enabled={userDetails.enabled}
      accountExpiryDate={userDetails.accountExpiryDate}
    />
  );
};

type AccountStatusFormProps = {
  readonly userId: string;
  readonly enabled: boolean;
  readonly accountExpiryDate: string | null;
};

function AccountStatusForm({
  userId,
  enabled,
  accountExpiryDate,
}: AccountStatusFormProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const {
    mutate: saveAccountStatus,
    alertError,
    clearAlertError,
  } = useAlertMutation({
    mutationFn: async (data: AccountStatusInput) =>
      updateAccountStatus(userId, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries(userOptions(userId));
      await queryClient.invalidateQueries({ queryKey: [USER_KEY] });
      toast.success(t('varUpdatedSuccessfully', { var: t('accountStatus') }));
    },
  });

  const form = useAppForm({
    defaultValues: { enabled, accountExpiryDate },
    validators: { onDynamic: accountStatusInputSchema },
    validationLogic: revalidateLogic(),
    onSubmit: (sub) => {
      saveAccountStatus(sub.value);
      clearAlertError();
    },
  });

  return (
    <Card className="max-w-sm h-fit w-full break-inside-avoid mb-4">
      <CardHeader>
        <CardTitle>{t('accountStatus')}</CardTitle>
        <HeaderAlert error={alertError} />
      </CardHeader>
      <CardContent>
        <FieldSet>
          <FieldGroup>
            <form.AppField
              name="enabled"
              children={(field) => (
                <field.CheckboxField
                  label={t('accountEnabled')}
                  description={t('accountEnabledHint')}
                />
              )}
            />
            <form.AppField
              name="accountExpiryDate"
              children={(field) => (
                <field.SingleDatePickerField label={t('accessExpiryDate')} />
              )}
            />
            <form.Subscribe
              selector={(state) => state.values.accountExpiryDate}
              children={(expiry) =>
                expiry ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="self-start"
                    onClick={() =>
                      form.setFieldValue('accountExpiryDate', null)
                    }
                  >
                    {t('clearExpiryDate')}
                  </Button>
                ) : null
              }
            />
            <form.Subscribe
              selector={(state) => {
                if (!state.values.enabled) return t('accountStatusDisabled');
                const expiry = state.values.accountExpiryDate;
                if (expiry && expiry < toIsoDate(new Date())) {
                  return t('accountStatusExpired', {
                    date: formatDate(expiry),
                  });
                }
                if (expiry) {
                  return t('accountStatusActiveUntil', {
                    date: formatDate(expiry),
                  });
                }
                return t('accountStatusActiveNoExpiry');
              }}
              children={(message) => (
                <FieldDescription>{message}</FieldDescription>
              )}
            />
          </FieldGroup>
          <form.AppForm
            children={
              <form.SubmitAndResetButtons
                submitLabel={t('save')}
                resetLabel={t('cancel')}
              />
            }
          />
        </FieldSet>
      </CardContent>
    </Card>
  );
}
