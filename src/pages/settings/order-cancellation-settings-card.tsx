import { revalidateLogic } from '@tanstack/react-form';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PackageX } from 'lucide-react';
import type { FC } from 'react';
import type { AppSettingsResponse } from '@/schemas/settings';
import { orderCancellationSettingsFormSchema } from '@/schemas/settings';
import { updateAppSettings } from '@/api/settings-api';
import { APP_SETTINGS_KEY } from '@/query-options/settings-options';
import { useAppForm } from '@/hooks/use-form';
import { useAlertMutation } from '@/hooks/use-alert-mutation';
import { useTranslation } from '@/hooks/use-translation';
import { HeaderAlert } from '@/components/header-alert';
import { FieldGroup, FieldSet } from '@/components/ui/field';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatDateTime } from '@/lib/formatting';

type OrderCancellationSettingsCardProps = {
  readonly settings: AppSettingsResponse;
};

export const OrderCancellationSettingsCard: FC<
  OrderCancellationSettingsCardProps
> = ({ settings }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const {
    mutate: saveMutation,
    alertError,
    clearAlertError,
  } = useAlertMutation({
    // The settings PUT is whole-object, so any future setting is sent along unchanged.
    mutationFn: (orderCancellationWindowHours: number) =>
      updateAppSettings({ ...settings, orderCancellationWindowHours }),
    onSuccess: () => {
      toast.success(t('settingsSaved'));
      queryClient.invalidateQueries({ queryKey: [APP_SETTINGS_KEY] });
    },
  });

  const form = useAppForm({
    defaultValues: {
      orderCancellationWindowHours: settings.orderCancellationWindowHours,
    },
    validators: { onDynamic: orderCancellationSettingsFormSchema },
    validationLogic: revalidateLogic(),
    onSubmit: ({ value }) => {
      saveMutation(value.orderCancellationWindowHours);
      clearAlertError();
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <PackageX className="mr-2 inline" size="20" />
          {t('orderCancellationSettings')}
        </CardTitle>
        <CardDescription>
          {t('orderCancellationWindowHoursHint')}
        </CardDescription>
        <HeaderAlert error={alertError} />
      </CardHeader>
      <CardContent>
        <FieldSet>
          <FieldGroup>
            <form.AppField
              name="orderCancellationWindowHours"
              children={(field) => (
                <field.NumberField
                  label={t('orderCancellationWindowHours')}
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
      {settings.lastModifiedDate && settings.lastModifiedBy && (
        <CardFooter className="text-xs text-muted-foreground">
          {t('lastChangedByOn', {
            date: formatDateTime(settings.lastModifiedDate),
            user: settings.lastModifiedBy,
          })}
        </CardFooter>
      )}
    </Card>
  );
};
