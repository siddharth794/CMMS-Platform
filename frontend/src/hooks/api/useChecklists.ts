import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { checklistsApi } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';
import { Checklist } from '@/types/models';

export const useChecklists = (params?: any) => {
  return useQuery<{ data: Checklist[]; total: number }>({
    queryKey: ['checklists', params],
    queryFn: () => checklistsApi.list(params).then((res) => res.data),
  });
};

export const useChecklist = (id: string) => {
  return useQuery<Checklist>({
    queryKey: ['checklists', id],
    queryFn: () => checklistsApi.get(id).then((res) => res.data),
    enabled: !!id,
  });
};

export const useCreateChecklist = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useNotification();
  
  return useMutation({
    mutationFn: (data: any) => checklistsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
      addNotification('success', 'Checklist created successfully');
    },
    onError: (error: any) => {
      addNotification('error', error.response?.data?.message || 'Failed to create checklist');
    },
  });
};

export const useUpdateChecklist = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useNotification();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => checklistsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
      queryClient.invalidateQueries({ queryKey: ['checklists', variables.id] });
      addNotification('success', 'Checklist updated successfully');
    },
    onError: (error: any) => {
      addNotification('error', error.response?.data?.message || 'Failed to update checklist');
    },
  });
};

export const useDeleteChecklist = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useNotification();
  
  return useMutation({
    mutationFn: (id: string) => checklistsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
      addNotification('success', 'Checklist deleted successfully');
    },
    onError: (error: any) => {
      addNotification('error', error.response?.data?.message || 'Failed to delete checklist');
    },
  });
};

export const useToggleChecklistItem = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useNotification();

  return useMutation({
    mutationFn: ({ checklistId, itemId, is_completed }: { checklistId: string; itemId: string; is_completed: boolean }) => 
      checklistsApi.toggleItem(checklistId, itemId, is_completed),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['checklists', variables.checklistId] });
      // We don't necessarily show a success toast for every toggle to avoid spamming the user
    },
    onError: (error: any) => {
      addNotification('error', error.response?.data?.message || 'Failed to toggle checklist item');
    },
  });
};
