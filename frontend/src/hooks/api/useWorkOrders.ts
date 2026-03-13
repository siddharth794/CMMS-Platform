import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workOrdersApi } from '../../lib/api';
import { WorkOrder, PaginatedResponse } from '../../types/models';

export const useWorkOrders = (params: any) => {
  return useQuery({
    queryKey: ['workOrders', params],
    queryFn: async (): Promise<PaginatedResponse<WorkOrder>> => {
      const { data } = await workOrdersApi.list(params);
      return data;
    },
    // Keep previous data when changing pages to avoid layout shift
    placeholderData: (previousData) => previousData,
  });
};

export const useCreateWorkOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<WorkOrder>) => {
      const { data } = await workOrdersApi.create(payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
    },
  });
};

export const useAssignWorkOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, assignee_id }: { id: string; assignee_id: string }) => {
      const { data } = await workOrdersApi.assign(id, { assignee_id });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
    },
  });
};

export const useUpdateWorkOrderStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const { data } = await workOrdersApi.updateStatus(id, { status, notes });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
    },
  });
};

export const useDeleteWorkOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await workOrdersApi.delete(id);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
    },
  });
};

export const useRestoreWorkOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await workOrdersApi.restore(id);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
    },
  });
};

export const useBulkDeleteWorkOrders = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, force }: { ids: string[]; force: boolean }) => {
      const { data } = await workOrdersApi.bulkDelete({ ids, force });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
    },
  });
};
