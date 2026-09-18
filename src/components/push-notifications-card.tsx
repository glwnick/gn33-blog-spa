import { Bell, BellOff } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import type { FC } from 'react';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { useTranslation } from '@/hooks/use-translation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

/**
 * Browser-level Web Push opt-in: whether THIS device is subscribed at all. The separate per-channel toggle
 * (NotificationPreferencesCard) controls whether push is used for a given notification type once a device is
 * subscribed here - the two are independent, device-level vs. account-level settings.
 */
export const PushNotificationsCard: FC = () => {
  const { t } = useTranslation();
  const { status, isConfigured, enable, disable, isBusy } =
    usePushNotifications();
  const [isToggling, setIsToggling] = useState(false);

  if (status === 'unsupported') {
    return null;
  }

  // Stay hidden until the backend is confirmed to have a VAPID keypair. `undefined` means the config probe is
  // still loading (avoid a flash of a card we may hide); `false` means push is off server-side (a staged
  // rollout before keys are provisioned), in which case the opt-in must not appear at all.
  if (isConfigured !== true) {
    return null;
  }

  const handleEnable = async () => {
    setIsToggling(true);
    try {
      await enable();
      toast.success(t('pushNotificationsEnabled'));
    } catch {
      toast.error(t('pushNotificationsEnableFailed'));
    } finally {
      setIsToggling(false);
    }
  };

  const handleDisable = async () => {
    setIsToggling(true);
    try {
      await disable();
      toast.success(t('pushNotificationsDisabled'));
    } catch {
      toast.error(t('pushNotificationsDisableFailed'));
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <Card className="max-w-sm h-fit w-full break-inside-avoid mb-4">
      <CardHeader>
        <CardTitle>
          <Bell className="mr-2 inline" size="20" />
          {t('pushNotifications')}
        </CardTitle>
        <CardDescription>
          {status === 'denied'
            ? t('pushNotificationsDeniedHint')
            : t('pushNotificationsHint')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status === 'checking' ? null : status === 'subscribed' ? (
          <Button
            variant="outline"
            disabled={isBusy || isToggling}
            onClick={handleDisable}
          >
            <BellOff />
            {t('disablePushNotifications')}
          </Button>
        ) : status === 'denied' ? null : (
          <Button disabled={isBusy || isToggling} onClick={handleEnable}>
            <Bell />
            {t('enablePushNotifications')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
