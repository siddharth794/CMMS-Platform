import { useQuery } from '@tanstack/react-query';
import { assetsApi, usersApi, sitesApi } from '../../lib/api';
import { Asset, User, Site } from '../../types/models';

export const useAssets = (params?: any) => {
  return useQuery({
    queryKey: ['assets', params],
    queryFn: async (): Promise<Asset[]> => {
      const { data } = await assetsApi.list(params || { limit: 1000 });
      return Array.isArray(data) ? data : (data?.data || []);
    },
  });
};

export const useUsers = (params?: any) => {
  return useQuery({
    queryKey: ['users', params],
    queryFn: async (): Promise<User[]> => {
      const { data } = await usersApi.list(params || { limit: 1000 });
      return Array.isArray(data) ? data : (data?.data || []);
    },
  });
};

export const useSites = (params?: any) => {
  return useQuery({
    queryKey: ['sites', params],
    queryFn: async (): Promise<Site[]> => {
      const { data } = await sitesApi.list(params || { limit: 1000 });
      return Array.isArray(data) ? data : (data?.data || []);
    },
  });
};
