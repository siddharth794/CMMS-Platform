import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { areasApi } from '../../lib/api';

export function useFloors(siteId: string | undefined) {
  return useQuery({
    queryKey: ['floors', siteId],
    queryFn: async () => {
      if (!siteId) return { data: [] };
      const { data } = await areasApi.getFloors(siteId);
      return data;
    },
    enabled: !!siteId,
  });
}

export function useAreas(floorId: string | undefined) {
  return useQuery({
    queryKey: ['areas', floorId],
    queryFn: async () => {
      if (!floorId) return { data: [] };
      const { data } = await areasApi.getAreas(floorId);
      return data;
    },
    enabled: !!floorId,
  });
}

export function useAreaDetails(areaId: string | undefined) {
  return useQuery({
    queryKey: ['area', areaId],
    queryFn: async () => {
      if (!areaId) return null;
      const { data } = await areasApi.getArea(areaId);
      return data;
    },
    enabled: !!areaId,
  });
}

export function useAreaSchedules(areaId: string | undefined) {
  return useQuery({
    queryKey: ['area_schedules', areaId],
    queryFn: async () => {
      if (!areaId) return { data: [] };
      const { data } = await areasApi.getSchedules(areaId);
      return data;
    },
    enabled: !!areaId,
  });
}

export function useAreaExecutions(filters?: any) {
  return useQuery({
    queryKey: ['area_executions', filters],
    queryFn: async () => {
      const { data } = await areasApi.getExecutions(filters);
      return data;
    },
  });
}

export function useMutateAreaTask() {
  const queryClient = useQueryClient();

  const verifyQrMutation = useMutation({
    mutationFn: (params: { id: string; qr_code_hash: string }) => areasApi.verifyQr(params.id, params.qr_code_hash),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['area_executions'] });
    },
  });

  const completeTaskMutation = useMutation({
    mutationFn: (id: string) => areasApi.completeTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['area_executions'] });
    },
  });

  const deleteFloorMutation = useMutation({
    mutationFn: (id: string) => areasApi.deleteFloor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floors'] });
    },
  });

  const deleteAreaMutation = useMutation({
    mutationFn: (id: string) => areasApi.deleteArea(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas'] });
    },
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: (id: string) => areasApi.deleteSchedule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['area_schedules'] });
    },
  });

  return { verifyQrMutation, completeTaskMutation, deleteFloorMutation, deleteAreaMutation, deleteScheduleMutation };
}