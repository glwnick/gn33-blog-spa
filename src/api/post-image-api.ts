import API_ENDPOINTS from '@/config/api-endpoints';
import api from '@/lib/axios';

/** Uploads a cover/gallery image and returns the site-relative path to store in the post. */
export const uploadPostImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post<string>(API_ENDPOINTS.postImages.upload, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};
