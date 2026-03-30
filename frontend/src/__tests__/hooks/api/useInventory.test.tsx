import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useInventoryData, useInventoryItem, useCreateInventoryItem, useUpdateInventoryItem, useDeleteInventoryItem } from '../../../hooks/api/useInventory';

vi.mock('../../../lib/api', () => ({
  inventoryApi: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import { inventoryApi } from '../../../lib/api';

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

describe('useInventory Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useInventoryData', () => {
    it('should fetch inventory items', async () => {
      (inventoryApi.list as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { data: [{ id: '1', name: 'Air Filter' }], total: 1 }
      });

      const { result } = renderHook(() => useInventoryData(), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(inventoryApi.list).toHaveBeenCalled();
    });
  });

  describe('useInventoryItem', () => {
    it('should fetch single inventory item', async () => {
      (inventoryApi.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { id: '1', name: 'Air Filter' }
      });

      const { result } = renderHook(() => useInventoryItem('1'), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(inventoryApi.get).toHaveBeenCalled();
    });
  });

  describe('useCreateInventoryItem', () => {
    it('should create inventory item', async () => {
      (inventoryApi.create as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { id: '1', name: 'New Item' }
      });

      const { result } = renderHook(() => useCreateInventoryItem(), { wrapper: createWrapper() });

      await waitFor(async () => {
        await result.current.mutateAsync({ name: 'New Item' });
      });

      expect(inventoryApi.create).toHaveBeenCalled();
    });
  });

  describe('useUpdateInventoryItem', () => {
    it('should update inventory item', async () => {
      (inventoryApi.update as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { id: '1', quantity: 100 }
      });

      const { result } = renderHook(() => useUpdateInventoryItem(), { wrapper: createWrapper() });

      await waitFor(async () => {
        await result.current.mutateAsync({ id: '1', data: { quantity: 100 } });
      });

      expect(inventoryApi.update).toHaveBeenCalled();
    });
  });

  describe('useDeleteInventoryItem', () => {
    it('should delete inventory item', async () => {
      (inventoryApi.delete as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { success: true } });

      const { result } = renderHook(() => useDeleteInventoryItem(), { wrapper: createWrapper() });

      await waitFor(async () => {
        await result.current.mutateAsync('1');
      });

      expect(inventoryApi.delete).toHaveBeenCalledWith('1');
    });
  });
});
