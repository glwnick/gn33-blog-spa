import type { CreateObjectResponse } from '@/schemas/common';
import type { AdminYarn, AdminYarnInput } from '@/schemas/yarns';
import { adminYarnSchema } from '@/schemas/yarns';
import API_ENDPOINTS from '@/config/api-endpoints';
import api from '@/lib/axios';

export const getAdminYarns = async (): Promise<Array<AdminYarn>> => {
  const res = await api.get<Array<AdminYarn>>(API_ENDPOINTS.adminYarns.list);
  return res.data.map((item) => adminYarnSchema.parse(item));
};

/** The product names behind a yarn's usage count, for the delete dialog's "used by" list. */
export const getProductsUsingYarn = async (
  yarnId: string,
): Promise<Array<string>> => {
  const res = await api.get<Array<string>>(
    API_ENDPOINTS.adminYarns.products(yarnId),
  );
  return res.data;
};

export const createAdminYarn = async (
  input: AdminYarnInput,
): Promise<CreateObjectResponse> => {
  const res = await api.post(API_ENDPOINTS.adminYarns.create, input);
  return res.data;
};

export const updateAdminYarn = async (
  yarnId: string,
  input: AdminYarnInput,
): Promise<AdminYarn> => {
  const res = await api.put(API_ENDPOINTS.adminYarns.update(yarnId), input);
  return adminYarnSchema.parse(res.data);
};

export const deleteAdminYarn = async (yarnId: string): Promise<void> => {
  await api.delete(API_ENDPOINTS.adminYarns.delete(yarnId));
};
