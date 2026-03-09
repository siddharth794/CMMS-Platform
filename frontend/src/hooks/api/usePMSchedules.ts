import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pmSchedulesApi } from '../../lib/api';

export const usePMSchedules = (params?: any) => {
  return useQuery({
    queryKey: ['pm-schedules', params],
    queryFn: async () => {
      const { data } = await pmSchedulesApi.list(params);
      return data;
    },
  });
};

export const usePMSchedule = (id: string) => {
  return useQuery({
    queryKey: ['pm-schedules', id],
    queryFn: async () => {
      const { data } = await pmSchedulesApi.get(id);
      return data;
    },
    enabled: !!id && id !== 'new',
  });
};

export const useCreatePMSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => pmSchedulesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pm-schedules'] });
    },
  });
};

export const useUpdatePMSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => pmSchedulesApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pm-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['pm-schedules', variables.id] });
    },
  });
};

export const useDeletePMSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pmSchedulesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pm-schedules'] });
    },
  });
};
