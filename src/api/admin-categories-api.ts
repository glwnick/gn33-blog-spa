import type { CreateObjectResponse } from '@/schemas/common';
import type { AdminCategory, AdminCategoryForm } from '@/schemas/admin-categories';
import { adminCategorySchema } from '@/schemas/admin-categories';
import API_ENDPOINTS from '@/config/api-endpoints';
import api from '@/lib/axios';

export const getAdminCategories = async (): Promise<Array<AdminCategory>> => {
  const res = await api.get(API_ENDPOINTS.adminCategories.list);
  return adminCategorySchema.array().parse(res.data);
};

export const createAdminCategory = async (
  data: AdminCategoryForm,
): Promise<CreateObjectResponse> => {
  const res = await api.post<CreateObjectResponse>(
    API_ENDPOINTS.adminCategories.create,
    data,
  );
  return res.data;
};

export const updateAdminCategory = async (
  categoryId: string,
  data: AdminCategoryForm,
): Promise<AdminCategory> => {
  const res = await api.put(API_ENDPOINTS.adminCategories.update(categoryId), data);
  return adminCategorySchema.parse(res.data);
};

export const updateAdminCategoryMakingLeadTime = async (
  categoryId: string,
  makingLeadTimeDays: number | null,
): Promise<void> => {
  await api.put(API_ENDPOINTS.adminCategories.makingLeadTime(categoryId), {
    makingLeadTimeDays,
  });
};

export const deleteAdminCategory = async (categoryId: string): Promise<void> => {
  await api.delete(API_ENDPOINTS.adminCategories.delete(categoryId));
};
