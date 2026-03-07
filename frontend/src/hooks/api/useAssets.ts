import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assetsApi } from '../../lib/api';
import { Asset, PaginatedResponse } from '../../types/models';

export const useAssetsData = (params?: any) => {
  return useQuery({
    queryKey: ['assets', params],
    queryFn: async (): Promise<PaginatedResponse<Asset>> => {
      const { data } = await assetsApi.list(params);
      return data;
    },
  });
};

export const useAsset = (id: string) => {
  return useQuery({
    queryKey: ['assets', id],
    queryFn: async (): Promise<Asset> => {
      const { data } = await assetsApi.get(id);
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateAsset = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => assetsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
};

export const useUpdateAsset = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => assetsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['assets', variables.id] });
    },
  });
};

export const useDeleteAsset = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => assetsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
};
