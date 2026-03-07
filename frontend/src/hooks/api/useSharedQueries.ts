import { useQuery } from '@tanstack/react-query';
import { assetsApi, usersApi } from '../../lib/api';
import { Asset, User } from '../../types/models';

export const useAssets = (params?: any) => {
  return useQuery({
    queryKey: ['assets', params],
    queryFn: async (): Promise<Asset[]> => {
      const { data } = await assetsApi.list(params || { limit: 1000 });
      return data.data || data;
    },
  });
};

export const useUsers = (params?: any) => {
  return useQuery({
    queryKey: ['users', params],
    queryFn: async (): Promise<User[]> => {
      const { data } = await usersApi.list(params || { limit: 1000 });
      return data.data || data;
    },
  });
};
