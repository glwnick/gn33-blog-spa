import type { CreateObjectResponse } from '@/schemas/common';
import type { AdminMaterial, AdminMaterialInput } from '@/schemas/materials';
import { adminMaterialSchema } from '@/schemas/materials';
import API_ENDPOINTS from '@/config/api-endpoints';
import api from '@/lib/axios';

export const getAdminMaterials = async (): Promise<Array<AdminMaterial>> => {
  const res = await api.get<Array<AdminMaterial>>(
    API_ENDPOINTS.adminMaterials.list,
  );
  return res.data.map((item) => adminMaterialSchema.parse(item));
};

/** The product names behind a material's usage count, for the delete dialog's "used by" list. */
export const getProductsUsingMaterial = async (
  materialId: string,
): Promise<Array<string>> => {
  const res = await api.get<Array<string>>(
    API_ENDPOINTS.adminMaterials.products(materialId),
  );
  return res.data;
};

export const createAdminMaterial = async (
  input: AdminMaterialInput,
): Promise<CreateObjectResponse> => {
  const res = await api.post(API_ENDPOINTS.adminMaterials.create, input);
  return res.data;
};

export const updateAdminMaterial = async (
  materialId: string,
  input: AdminMaterialInput,
): Promise<AdminMaterial> => {
  const res = await api.put(
    API_ENDPOINTS.adminMaterials.update(materialId),
    input,
  );
  return adminMaterialSchema.parse(res.data);
};

export const deleteAdminMaterial = async (materialId: string): Promise<void> => {
  await api.delete(API_ENDPOINTS.adminMaterials.delete(materialId));
};
