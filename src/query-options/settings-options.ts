import { queryOptions } from '@tanstack/react-query';
import { DEFAULT_STALE_TIME } from '@/config/query';
import { getAppSettings } from '@/api/settings-api';

export const APP_SETTINGS_KEY = 'app-settings' as const;

export const appSettingsOptions = () => {
  return queryOptions({
    queryKey: [APP_SETTINGS_KEY],
    queryFn: () => getAppSettings(),
    staleTime: DEFAULT_STALE_TIME,
  });
};
