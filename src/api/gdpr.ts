import type { DeleteAccountRequest } from '@/schemas/gdpr';
import API_ENDPOINTS from '@/config/api-endpoints';
import api from '@/lib/axios';

export const exportMyData = async (): Promise<Blob> => {
  const res = await api.get<Blob>(API_ENDPOINTS.gdpr.export, {
    responseType: 'blob',
  });
  return res.data;
};

export const deleteMyAccount = async (
  request: DeleteAccountRequest,
): Promise<void> => {
  await api.delete(API_ENDPOINTS.gdpr.deleteAccount, { data: request });
};
