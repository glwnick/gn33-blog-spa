import { revalidateLogic } from '@tanstack/react-form';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BellRing } from 'lucide-react';
import type { FC } from 'react';
import type { NotificationPreferences } from '@/schemas/notifications';
import { notificationPreferencesSchema } from '@/schemas/notifications';
import { saveNotificationPreferences } from '@/api/notifications-api';
import {
  NOTIFICATION_PREFERENCES_KEY,
  notificationPreferencesOptions,
} from '@/query-options/notifications-options';
import { useAppForm } from '@/hooks/use-form';
import { useAlertMutation } from '@/hooks/use-alert-mutation';
import { useTranslation } from '@/hooks/use-translation';
import { HeaderAlert } from '@/components/header-alert';
import { FieldGroup, FieldSet } from '@/components/ui/field';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

/**
 * Per-channel opt-in for the three time-sensitive notification types (waitlist promotion, class reminder, event
 * cancellation). WhatsApp can only be turned on once a verified number exists - see WhatsAppVerificationCard -
 * the backend rejects the toggle otherwise and that message surfaces here via HeaderAlert.
 */
export const NotificationPreferencesCard: FC = () => {
  const { data } = useQuery(notificationPreferencesOptions());

  if (data === undefined) return null;
  return <NotificationPreferencesForm value={data} />;
};

type NotificationPreferencesFormProps = {
  readonly value: NotificationPreferences;
};

function NotificationPreferencesForm({
  value,
}: NotificationPreferencesFormProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const {
    mutate: save,
    alertError,
    clearAlertError,
  } = useAlertMutation({
    mutationFn: (input: NotificationPreferences) =>
      saveNotificationPreferences(input),
    onSuccess: () => {
      toast.success(t('settingsSaved'));
      queryClient.invalidateQueries({
        queryKey: [NOTIFICATION_PREFERENCES_KEY],
      });
    },
  });

  const form = useAppForm({
    defaultValues: value,
    validators: { onDynamic: notificationPreferencesSchema },
    validationLogic: revalidateLogic(),
    onSubmit: ({ value: submitted }) => {
      save(submitted);
      clearAlertError();
    },
  });

  return (
    <Card className="max-w-sm h-fit w-full break-inside-avoid mb-4">
      <CardHeader>
        <CardTitle>
          <BellRing className="mr-2 inline" size="20" />
          {t('notificationPreferences')}
        </CardTitle>
        <CardDescription>{t('notificationPreferencesHint')}</CardDescription>
        <HeaderAlert error={alertError} />
      </CardHeader>
      <CardContent>
        <FieldSet>
          <FieldGroup>
            <form.AppField
              name="notifyEmail"
              children={(field) => (
                <field.CheckboxField label={t('notifyByEmail')} />
              )}
            />
            <form.AppField
              name="notifyWebPush"
              children={(field) => (
                <field.CheckboxField label={t('notifyByPush')} />
              )}
            />
            <form.AppField
              name="notifyWhatsapp"
              children={(field) => (
                <field.CheckboxField
                  label={t('notifyByWhatsapp')}
                  description={t('notifyByWhatsappHint')}
                />
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
