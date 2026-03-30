import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAssetsData, useAsset, useCreateAsset, useUpdateAsset, useDeleteAsset } from '../../../hooks/api/useAssets';

vi.mock('../../../lib/api', () => ({
  assetsApi: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import { assetsApi } from '../../../lib/api';

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

describe('useAssets Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useAssetsData', () => {
    it('should fetch assets', async () => {
      (assetsApi.list as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { data: [{ id: '1', name: 'Test Asset' }], total: 1 }
      });

      const { result } = renderHook(() => useAssetsData({}), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(assetsApi.list).toHaveBeenCalled();
    });

    it('should return data on success', async () => {
      const mockData = { data: [{ id: '1', name: 'Test Asset' }], total: 1 };
      (assetsApi.list as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockData });

      const { result } = renderHook(() => useAssetsData(), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockData);
    });
  });

  describe('useAsset', () => {
    it('should fetch single asset', async () => {
      (assetsApi.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { id: '1', name: 'Test Asset' }
      });

      const { result } = renderHook(() => useAsset('1'), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(assetsApi.get).toHaveBeenCalled();
    });
  });

  describe('useCreateAsset', () => {
    it('should create asset', async () => {
      (assetsApi.create as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { id: '1', name: 'New Asset' }
      });

      const { result } = renderHook(() => useCreateAsset(), { wrapper: createWrapper() });

      await waitFor(async () => {
        await result.current.mutateAsync({ name: 'New Asset' });
      });

      expect(assetsApi.create).toHaveBeenCalled();
    });
  });

  describe('useUpdateAsset', () => {
    it('should update asset', async () => {
      (assetsApi.update as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { id: '1', name: 'Updated Asset' }
      });

      const { result } = renderHook(() => useUpdateAsset(), { wrapper: createWrapper() });

      await waitFor(async () => {
        await result.current.mutateAsync({ id: '1', data: { name: 'Updated Asset' } });
      });

      expect(assetsApi.update).toHaveBeenCalled();
    });
  });

  describe('useDeleteAsset', () => {
    it('should delete asset', async () => {
      (assetsApi.delete as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { success: true } });

      const { result } = renderHook(() => useDeleteAsset(), { wrapper: createWrapper() });

      await waitFor(async () => {
        await result.current.mutateAsync('1');
      });

      expect(assetsApi.delete).toHaveBeenCalledWith('1');
    });
  });
});
