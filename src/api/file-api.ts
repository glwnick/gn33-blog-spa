import API_ENDPOINTS from '@/config/api-endpoints';
import api from '@/lib/axios';

export const getThumbnail = async (
  entityId: string,
  fileName: string,
): Promise<Blob> => {
  const res = await api.get<Blob>(
    API_ENDPOINTS.files.downloadThumbnail(entityId, fileName),
    {
      responseType: 'blob',
    },
  );
  return res.data;
};

export const getOriginalPicture = async (
  entityId: string,
  fileName: string,
): Promise<Blob> => {
  const res = await api.get<Blob>(
    API_ENDPOINTS.files.downloadPicture(entityId, fileName),
    {
      responseType: 'blob',
    },
  );
  return res.data;
};
