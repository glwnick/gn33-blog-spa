import { z } from 'zod';
import api from '@/lib/axios';
import API_ENDPOINTS from '@/config/api-endpoints';
import { collectionTypeSchema } from '@/schemas/collections';

const roleType = z.object({
  roleId: z.uuid(),
  role: collectionTypeSchema,
});

export type RoleType = z.infer<typeof roleType>;

export const getRoles = async (): Promise<Array<RoleType>> => {
  const res = await api.get<Array<RoleType>>(API_ENDPOINTS.roles.list);
  return res.data;
};

export const getUserRoles = async (
  userId: string,
): Promise<Array<RoleType>> => {
  const res = await api.get<Array<RoleType>>(
    API_ENDPOINTS.users.getRoles(userId),
  );
  return res.data;
};

export const assignRole = async (
  userId: string,
  roleId: string,
): Promise<void> => {
  await api.post(API_ENDPOINTS.users.assignRole(userId, roleId));
};

export const removeRole = async (
  userId: string,
  roleId: string,
): Promise<void> => {
  await api.delete(API_ENDPOINTS.users.deleteRole(userId, roleId));
};
