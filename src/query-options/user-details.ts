import { queryOptions } from '@tanstack/react-query';
import { getUser } from '@/api/user-api';

export const profileOptions = (userId: string) => {
  return queryOptions({
    queryKey: ['users', userId, 'profile'],
    queryFn: async () => getUser(userId),
    staleTime: Infinity,
  });
};
