import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSites } from '../../../hooks/api/useSites';

vi.mock('../../../lib/api', () => ({
  sitesApi: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import { sitesApi } from '../../../lib/api';

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

describe('useSites Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useSites', () => {
    it('should fetch sites', async () => {
      (sitesApi.list as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { data: [{ id: '1', name: 'Main Facility' }], total: 1 }
      });

      const { result } = renderHook(() => useSites(), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(sitesApi.list).toHaveBeenCalled();
    });

    it('should return sites data on success', async () => {
      const mockData = { data: [{ id: '1', name: 'Main Facility' }], total: 1 };
      (sitesApi.list as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockData });

      const { result } = renderHook(() => useSites(), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockData);
    });
  });
});
