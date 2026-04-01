import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useOrganizations } from '../../../hooks/api/useOrganizations';

vi.mock('../../../lib/api', () => ({
  organizationsApi: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import { organizationsApi } from '../../../lib/api';

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

describe('useOrganizations Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useOrganizations', () => {
    it('should fetch organizations', async () => {
      (organizationsApi.list as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { data: [{ id: '1', name: 'Demo Org' }], total: 1 }
      });

      const { result } = renderHook(() => useOrganizations(), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(organizationsApi.list).toHaveBeenCalled();
    });

    it('should return organizations data on success', async () => {
      const mockData = { data: [{ id: '1', name: 'Demo Org' }], total: 1 };
      (organizationsApi.list as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockData });

      const { result } = renderHook(() => useOrganizations(), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockData);
    });
  });
});
