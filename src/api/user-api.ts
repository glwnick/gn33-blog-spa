import type { Page, PageResponse } from '@/types/pageable';
import type {
  AccountStatusInput,
  ChangePasswordInput,
  CreateUserInput,
  UpdateUserInput,
  UserDetailsResponse,
  UserListFilters,
  UserResponse,
  UserStatsResponse,
} from '@/schemas/users';
import type { CreateObjectResponse } from '@/schemas/common';
import type { AxiosResponse } from 'axios';
import {
  userDetailsResponseSchema,
  userResponseSchema,
  userStatsResponseSchema,
} from '@/schemas/users';
import API_ENDPOINTS from '@/config/api-endpoints';
import api from '@/lib/axios';

export const uploadPicture = async (
  userId: string,
  file: File,
): Promise<AxiosResponse<string>> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.put<string>(
    API_ENDPOINTS.users.uploadProfilePicture(userId),
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return res;
};

export const deletePicture = async (userId: string): Promise<AxiosResponse> => {
  const res = await api.delete(
    API_ENDPOINTS.users.deleteProfilePicture(userId),
  );
  return res;
};

export const getUsers = async (
  filters: UserListFilters,
): Promise<Page<UserResponse>> => {
  const res = await api.get<PageResponse<UserResponse>>(
    API_ENDPOINTS.users.list,
    {
      params: filters,
    },
  );

  return {
    ...res.data.page,
    content: res.data.content.map((item) => userResponseSchema.parse(item)),
  };
};

export const updateProfile = async (
  userId: string,
  data: UpdateUserInput,
): Promise<void> => {
  await api.put(API_ENDPOINTS.users.update(userId), data);
};

export const createUser = async (
  data: CreateUserInput,
): Promise<CreateObjectResponse> => {
  const res = await api.post<CreateObjectResponse>(
    API_ENDPOINTS.users.create,
    data,
  );
  return res.data;
};

export const getUser = async (userId: string): Promise<UserDetailsResponse> => {
  const res = await api.get<UserDetailsResponse>(
    API_ENDPOINTS.users.details(userId),
  );
  return userDetailsResponseSchema.parse(res.data);
};

export const changePassword = async (
  data: ChangePasswordInput,
): Promise<{ message: string }> => {
  const res = await api.put<{ message: string }>(
    API_ENDPOINTS.auth.changePassword,
    data,
  );
  return res.data;
};

export const deleteUser = async (userId: string): Promise<void> => {
  await api.delete(API_ENDPOINTS.users.delete(userId));
};


export const updateAccountStatus = async (
  userId: string,
  data: AccountStatusInput,
): Promise<UserDetailsResponse> => {
  const res = await api.put<UserDetailsResponse>(
    API_ENDPOINTS.users.accountStatus(userId),
    data,
  );
  return userDetailsResponseSchema.parse(res.data);
};

export const gdprEraseUser = async (userId: string): Promise<void> => {
  await api.post(API_ENDPOINTS.users.gdprErase(userId));
};

export const getUserStats = async (): Promise<UserStatsResponse> => {
  const res = await api.get<UserStatsResponse>(API_ENDPOINTS.users.stats);
  return userStatsResponseSchema.parse(res.data);
};

