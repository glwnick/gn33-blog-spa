import { useMutation } from '@tanstack/react-query';
import type { ApiResponseError } from '@/lib/api-error';
import { exportMyData } from '@/api/gdpr';

// Account deletion uses `useAlertMutation` directly in the privacy page
// (it needs the inline `alertError` state for the confirm dialog), so only
// the export mutation is exposed here.
export const useExportMyDataMutation = () =>
  useMutation<Blob, ApiResponseError, void>({
    mutationFn: exportMyData,
  });
