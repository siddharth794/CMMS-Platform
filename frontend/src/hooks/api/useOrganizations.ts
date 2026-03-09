import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationsApi } from '../../lib/api';
import { Organization, PaginatedResponse } from '../../types/models';

export const useOrganizations = (params: any) => {
  return useQuery({
    queryKey: ['organizations', params],
    queryFn: async (): Promise<PaginatedResponse<Organization>> => {
      const { data } = await organizationsApi.list(params);
      return data;
    },
    placeholderData: (previousData) => previousData,
  });
};

export const useOrganization = (id: string) => {
  return useQuery({
    queryKey: ['organizations', id],
    queryFn: async (): Promise<Organization> => {
      const { data } = await organizationsApi.get(id);
      return data;
    },
    enabled: !!id && id !== 'new',
  });
};

export const useCreateOrganization = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Organization>) => {
      const { data } = await organizationsApi.create(payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });
};

export const useUpdateOrganization = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Organization> }) => {
      const { data: responseData } = await organizationsApi.update(id, data);
      return responseData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });
};

export const useDeleteOrganization = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, force }: { id: string; force: boolean }) => {
      const { data } = await organizationsApi.delete(id, force);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });
};
