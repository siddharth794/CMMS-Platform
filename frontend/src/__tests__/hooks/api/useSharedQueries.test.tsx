import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAssets, useUsers, useSites } from '../../../hooks/api/useSharedQueries';

vi.mock('../../../lib/api', () => ({
  assetsApi: { list: vi.fn() },
  usersApi: { list: vi.fn() },
  sitesApi: { list: vi.fn() },
}));

import { assetsApi, usersApi, sitesApi } from '../../../lib/api';

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

describe('useSharedQueries Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useAssets', () => {
    it('should fetch assets', async () => {
      (assetsApi.list as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [{ id: '1', name: 'HVAC System' }]
      });

      const { result } = renderHook(() => useAssets(), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(assetsApi.list).toHaveBeenCalled();
    });
  });

  describe('useUsers', () => {
    it('should fetch users', async () => {
      (usersApi.list as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [{ id: '1', first_name: 'John' }]
      });

      const { result } = renderHook(() => useUsers(), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(usersApi.list).toHaveBeenCalled();
    });
  });

  describe('useSites', () => {
    it('should fetch sites', async () => {
      (sitesApi.list as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [{ id: '1', name: 'Main Facility' }]
      });

      const { result } = renderHook(() => useSites(), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(sitesApi.list).toHaveBeenCalled();
    });
  });
});
