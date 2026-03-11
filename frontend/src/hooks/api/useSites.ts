import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { sitesApi } from '../../lib/api';
import { Site, PaginatedResponse } from '../../types/models';

export const useSites = (params: any) => {
  return useQuery({
    queryKey: ['sites', params],
    queryFn: async (): Promise<PaginatedResponse<Site>> => {
      const { data } = await sitesApi.list(params);
      return data;
    },
    placeholderData: keepPreviousData,
  });
};

export const useSite = (id: string) => {
  return useQuery({
    queryKey: ['sites', id],
    queryFn: async (): Promise<Site> => {
      const { data } = await sitesApi.get(id);
      return data;
    },
    enabled: !!id && id !== 'new',
  });
};

export const useCreateSite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Site>) => {
      const { data } = await sitesApi.create(payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
    },
  });
};

export const useUpdateSite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Site> }) => {
      const { data: responseData } = await sitesApi.update(id, data);
      return responseData;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      queryClient.invalidateQueries({ queryKey: ['sites', variables.id] });
    },
  });
};

export const useDeleteSite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await sitesApi.delete(id);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
    },
  });
};

export const useAssignSiteManager = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, managerId }: { id: string; managerId: string | null }) => {
      const { data } = await sitesApi.assignManager(id, managerId);
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sites', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['sites'] });
    },
  });
};

export const useAssignSiteTechnician = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      const { data } = await sitesApi.assignTechnician(id, userId);
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sites', variables.id] });
    },
  });
};

export const useRemoveSiteTechnician = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      const { data } = await sitesApi.removeTechnician(id, userId);
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sites', variables.id] });
    },
  });
};
