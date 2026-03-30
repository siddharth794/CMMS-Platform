import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRoles, useCreateRole, useUpdateRole, useDeleteRole, useUpdateRoleAccesses } from '../../../hooks/api/useRBAC';

vi.mock('../../../lib/api', () => ({
  rolesApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    updateAccesses: vi.fn(),
  },
}));

import { rolesApi } from '../../../lib/api';

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

describe('useRBAC Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useRoles', () => {
    it('should fetch roles', async () => {
      (rolesApi.list as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [{ id: '1', name: 'super_admin' }]
      });

      const { result } = renderHook(() => useRoles(), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(rolesApi.list).toHaveBeenCalled();
    });
  });

  describe('useCreateRole', () => {
    it('should create role', async () => {
      (rolesApi.create as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { id: '1', name: 'New Role' }
      });

      const { result } = renderHook(() => useCreateRole(), { wrapper: createWrapper() });

      await waitFor(async () => {
        await result.current.mutateAsync({ name: 'New Role' });
      });

      expect(rolesApi.create).toHaveBeenCalled();
    });
  });

  describe('useUpdateRole', () => {
    it('should update role', async () => {
      (rolesApi.update as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { id: '1', name: 'Updated' }
      });

      const { result } = renderHook(() => useUpdateRole(), { wrapper: createWrapper() });

      await waitFor(async () => {
        await result.current.mutateAsync({ id: '1', data: { name: 'Updated' } });
      });

      expect(rolesApi.update).toHaveBeenCalled();
    });
  });

  describe('useDeleteRole', () => {
    it('should delete role', async () => {
      (rolesApi.delete as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { success: true } });

      const { result } = renderHook(() => useDeleteRole(), { wrapper: createWrapper() });

      await waitFor(async () => {
        await result.current.mutateAsync('1');
      });

      expect(rolesApi.delete).toHaveBeenCalledWith('1');
    });
  });

  describe('useUpdateRoleAccesses', () => {
    it('should update role accesses', async () => {
      (rolesApi.updateAccesses as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { success: true }
      });

      const { result } = renderHook(() => useUpdateRoleAccesses(), { wrapper: createWrapper() });

      await waitFor(async () => {
        await result.current.mutateAsync({ id: '1', accesses: ['read', 'write'] });
      });

      expect(rolesApi.updateAccesses).toHaveBeenCalled();
    });
  });
});
