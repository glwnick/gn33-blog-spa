import { queryOptions } from '@tanstack/react-query';
import {
  getNotificationPreferences,
  getWhatsAppStatus,
} from '@/api/notifications-api';

export const NOTIFICATION_PREFERENCES_KEY =
  'notification-preferences' as const;
export const WHATSAPP_STATUS_KEY = 'whatsapp-status' as const;

export const notificationPreferencesOptions = () =>
  queryOptions({
    queryKey: [NOTIFICATION_PREFERENCES_KEY],
    queryFn: getNotificationPreferences,
    staleTime: Infinity,
  });

export const whatsappStatusOptions = () =>
  queryOptions({
    queryKey: [WHATSAPP_STATUS_KEY],
    queryFn: getWhatsAppStatus,
    staleTime: Infinity,
  });
