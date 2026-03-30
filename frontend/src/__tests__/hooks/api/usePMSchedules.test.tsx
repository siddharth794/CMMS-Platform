import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePMSchedules, usePMSchedule, useCreatePMSchedule, useUpdatePMSchedule, useDeletePMSchedule } from '../../../hooks/api/usePMSchedules';

vi.mock('../../../lib/api', () => ({
  pmSchedulesApi: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import { pmSchedulesApi } from '../../../lib/api';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('usePMSchedules Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('usePMSchedules', () => {
    it('should fetch PM schedules', async () => {
      (pmSchedulesApi.list as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { data: [{ id: '1', name: 'Monthly Maintenance' }], total: 1 }
      });

      const { result } = renderHook(() => usePMSchedules(), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(pmSchedulesApi.list).toHaveBeenCalled();
    });
  });

  describe('usePMSchedule', () => {
    it('should fetch single PM schedule', async () => {
      (pmSchedulesApi.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { id: '1', name: 'Monthly Maintenance' }
      });

      const { result } = renderHook(() => usePMSchedule('1'), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(pmSchedulesApi.get).toHaveBeenCalled();
    });
  });

  describe('useCreatePMSchedule', () => {
    it('should create PM schedule', async () => {
      (pmSchedulesApi.create as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { id: '1', name: 'New Schedule' }
      });

      const { result } = renderHook(() => useCreatePMSchedule(), { wrapper: createWrapper() });

      await waitFor(async () => {
        await result.current.mutateAsync({ name: 'New Schedule' });
      });

      expect(pmSchedulesApi.create).toHaveBeenCalled();
    });
  });

  describe('useUpdatePMSchedule', () => {
    it('should update PM schedule', async () => {
      (pmSchedulesApi.update as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { id: '1', name: 'Updated Schedule' }
      });

      const { result } = renderHook(() => useUpdatePMSchedule(), { wrapper: createWrapper() });

      await waitFor(async () => {
        await result.current.mutateAsync({ id: '1', data: { name: 'Updated Schedule' } });
      });

      expect(pmSchedulesApi.update).toHaveBeenCalled();
    });
  });

  describe('useDeletePMSchedule', () => {
    it('should delete PM schedule', async () => {
      (pmSchedulesApi.delete as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { success: true } });

      const { result } = renderHook(() => useDeletePMSchedule(), { wrapper: createWrapper() });

      await waitFor(async () => {
        await result.current.mutateAsync('1');
      });

      expect(pmSchedulesApi.delete).toHaveBeenCalledWith('1');
    });
  });
});
