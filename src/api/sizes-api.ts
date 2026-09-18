import type { CreateObjectResponse } from '@/schemas/common';
import type { AdminSize, AdminSizeInput } from '@/schemas/sizes';
import { adminSizeSchema } from '@/schemas/sizes';
import API_ENDPOINTS from '@/config/api-endpoints';
import api from '@/lib/axios';

export const getAdminSizes = async (): Promise<Array<AdminSize>> => {
  const res = await api.get<Array<AdminSize>>(API_ENDPOINTS.adminSizes.list);
  return res.data.map((item) => adminSizeSchema.parse(item));
};

/** The product names behind a size's usage count, for the delete dialog's "used by" list. */
export const getProductsUsingSize = async (
  sizeId: string,
): Promise<Array<string>> => {
  const res = await api.get<Array<string>>(
    API_ENDPOINTS.adminSizes.products(sizeId),
  );
  return res.data;
};

export const createAdminSize = async (
  input: AdminSizeInput,
): Promise<CreateObjectResponse> => {
  const res = await api.post(API_ENDPOINTS.adminSizes.create, input);
  return res.data;
};

export const updateAdminSize = async (
  sizeId: string,
  input: AdminSizeInput,
): Promise<AdminSize> => {
  const res = await api.put(API_ENDPOINTS.adminSizes.update(sizeId), input);
  return adminSizeSchema.parse(res.data);
};

export const deleteAdminSize = async (sizeId: string): Promise<void> => {
  await api.delete(API_ENDPOINTS.adminSizes.delete(sizeId));
};
