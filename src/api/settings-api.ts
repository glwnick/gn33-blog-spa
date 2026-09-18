import type { AppSettingsResponse } from '@/schemas/settings';
import { appSettingsResponseSchema } from '@/schemas/settings';
import API_ENDPOINTS from '@/config/api-endpoints';
import api from '@/lib/axios';

export const getAppSettings = async (): Promise<AppSettingsResponse> => {
  const res = await api.get<AppSettingsResponse>(
    API_ENDPOINTS.adminSettings.get,
  );
  return appSettingsResponseSchema.parse(res.data);
};

export const updateAppSettings = async (
  settings: AppSettingsResponse,
): Promise<AppSettingsResponse> => {
  const res = await api.put<AppSettingsResponse>(
    API_ENDPOINTS.adminSettings.update,
    settings,
  );
  return appSettingsResponseSchema.parse(res.data);
};
