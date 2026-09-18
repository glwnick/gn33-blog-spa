import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import {
  originalPictureBlobOptions,
  thumbnailBlobOptions as thumbnailBlobOptionsBase,
} from './files-options';
import type { UserListFilters } from '@/schemas/users';
import { DEFAULT_STALE_TIME } from '@/config/query';
import { getUser, getUserStats, getUsers } from '@/api/user-api';
import { totpLogin } from '@/api/auth-api';
import env from '@/config/env';

export const USER_KEY = 'users' as const;

export const userOptions = (userId: string) => {
  return queryOptions({
    queryKey: [USER_KEY, userId],
    queryFn: () => getUser(userId),
    staleTime: DEFAULT_STALE_TIME,
  });
};

export const thumbnailBlobOptions = (userId: string, picture: string) => {
  return thumbnailBlobOptionsBase(USER_KEY, userId, picture);
};

export const originalPictureOptions = (userId: string, picture: string) => {
  return originalPictureBlobOptions(USER_KEY, userId, picture);
};

export const usersOptions = (filters: UserListFilters) => {
  return queryOptions({
    queryKey: [USER_KEY, filters],
    queryFn: () => getUsers(filters),
    placeholderData: keepPreviousData,
    staleTime: DEFAULT_STALE_TIME,
  });
};

export const userStatsOptions = () => {
  return queryOptions({
    queryKey: [USER_KEY, 'stats'],
    queryFn: () => getUserStats(),
    staleTime: DEFAULT_STALE_TIME,
  });
};

export const totpOptions = (account: string, enabled: boolean = true) => {
  const issuer = env.ISSUER;
  return queryOptions({
    queryKey: ['totp'],
    queryFn: totpLogin,
    staleTime: DEFAULT_STALE_TIME,
    enabled,
    select: (data) =>
      `otpauth://totp/${issuer}:${account}?secret=${data}&issuer=${issuer}`,
  });
};

