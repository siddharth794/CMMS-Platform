import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useWorkOrders, useCreateWorkOrder, useAssignWorkOrder, useUpdateWorkOrderStatus, useDeleteWorkOrder, useRestoreWorkOrder, useBulkDeleteWorkOrders } from '../../../hooks/api/useWorkOrders';

vi.mock('../../../lib/api', () => ({
  workOrdersApi: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateStatus: vi.fn(),
    assign: vi.fn(),
    delete: vi.fn(),
    restore: vi.fn(),
    bulkDelete: vi.fn(),
  },
}));

import { workOrdersApi } from '../../../lib/api';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useWorkOrders Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useWorkOrders', () => {
    it('should fetch work orders', async () => {
      (workOrdersApi.list as ReturnType<typeof vi.fn>).mockResolvedValue({ 
        data: { data: [{ id: '1', title: 'Test WO' }], total: 1 } 
      });

      const { result } = renderHook(() => useWorkOrders({}), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(workOrdersApi.list).toHaveBeenCalledWith({});
    });
  });

  describe('useCreateWorkOrder', () => {
    it('should create work order', async () => {
      (workOrdersApi.create as ReturnType<typeof vi.fn>).mockResolvedValue({ 
        data: { id: '1', title: 'New WO' } 
      });

      const { result } = renderHook(() => useCreateWorkOrder(), { wrapper: createWrapper() });

      await waitFor(async () => {
        await result.current.mutateAsync({ title: 'New WO', status: 'new' });
      });

      expect(workOrdersApi.create).toHaveBeenCalled();
    });
  });

  describe('useAssignWorkOrder', () => {
    it('should assign work order', async () => {
      (workOrdersApi.assign as ReturnType<typeof vi.fn>).mockResolvedValue({ 
        data: { id: '1', assignee_id: '2' } 
      });

      const { result } = renderHook(() => useAssignWorkOrder(), { wrapper: createWrapper() });

      await waitFor(async () => {
        await result.current.mutateAsync({ id: '1', assignee_id: '2' });
      });

      expect(workOrdersApi.assign).toHaveBeenCalled();
    });
  });

  describe('useUpdateWorkOrderStatus', () => {
    it('should update work order status', async () => {
      (workOrdersApi.updateStatus as ReturnType<typeof vi.fn>).mockResolvedValue({ 
        data: { id: '1', status: 'in_progress' } 
      });

      const { result } = renderHook(() => useUpdateWorkOrderStatus(), { wrapper: createWrapper() });

      await waitFor(async () => {
        await result.current.mutateAsync({ id: '1', status: 'in_progress' });
      });

      expect(workOrdersApi.updateStatus).toHaveBeenCalled();
    });
  });

  describe('useDeleteWorkOrder', () => {
    it('should delete work order', async () => {
      (workOrdersApi.delete as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { success: true } });

      const { result } = renderHook(() => useDeleteWorkOrder(), { wrapper: createWrapper() });

      await waitFor(async () => {
        await result.current.mutateAsync('1');
      });

      expect(workOrdersApi.delete).toHaveBeenCalledWith('1');
    });
  });

  describe('useRestoreWorkOrder', () => {
    it('should restore work order', async () => {
      (workOrdersApi.restore as ReturnType<typeof vi.fn>).mockResolvedValue({ 
        data: { id: '1', is_active: true } 
      });

      const { result } = renderHook(() => useRestoreWorkOrder(), { wrapper: createWrapper() });

      await waitFor(async () => {
        await result.current.mutateAsync('1');
      });

      expect(workOrdersApi.restore).toHaveBeenCalledWith('1');
    });
  });

  describe('useBulkDeleteWorkOrders', () => {
    it('should bulk delete work orders', async () => {
      (workOrdersApi.bulkDelete as ReturnType<typeof vi.fn>).mockResolvedValue({ 
        data: { success: true, deleted: 3 } 
      });

      const { result } = renderHook(() => useBulkDeleteWorkOrders(), { wrapper: createWrapper() });

      await waitFor(async () => {
        await result.current.mutateAsync({ ids: ['1', '2', '3'], force: true });
      });

      expect(workOrdersApi.bulkDelete).toHaveBeenCalled();
    });
  });
});

import { renderHook } from '@testing-library/react';
