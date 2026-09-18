import type {
  NotificationPreferences,
  NotificationPreferencesResponse,
  WhatsAppStatus,
} from '@/schemas/notifications';
import {
  notificationPreferencesResponseSchema,
  whatsappStatusSchema,
} from '@/schemas/notifications';
import API_ENDPOINTS from '@/config/api-endpoints';
import api from '@/lib/axios';

export const getNotificationPreferences =
  async (): Promise<NotificationPreferences> => {
    const res = await api.get<NotificationPreferencesResponse>(
      API_ENDPOINTS.preferences.notifications,
    );
    const parsed = notificationPreferencesResponseSchema.parse(res.data);
    return {
      notifyEmail: parsed.email,
      notifyWebPush: parsed.webPush,
      notifyWhatsapp: parsed.whatsapp,
    };
  };

export const saveNotificationPreferences = async (
  value: NotificationPreferences,
): Promise<void> => {
  const payload: NotificationPreferencesResponse = {
    email: value.notifyEmail,
    webPush: value.notifyWebPush,
    whatsapp: value.notifyWhatsapp,
  };
  await api.put(API_ENDPOINTS.preferences.notifications, payload);
};

export const getWhatsAppStatus = async (): Promise<WhatsAppStatus> => {
  const res = await api.get<WhatsAppStatus>(API_ENDPOINTS.whatsapp.status);
  return whatsappStatusSchema.parse(res.data);
};

export const requestWhatsAppVerification = async (
  phoneNumber: string,
): Promise<void> => {
  await api.post(API_ENDPOINTS.whatsapp.verification, { phoneNumber });
};

export const confirmWhatsAppVerification = async (
  code: string,
): Promise<void> => {
  await api.post(API_ENDPOINTS.whatsapp.verificationConfirm, { code });
};

export const optOutWhatsApp = async (): Promise<void> => {
  await api.delete(API_ENDPOINTS.whatsapp.optOut);
};
