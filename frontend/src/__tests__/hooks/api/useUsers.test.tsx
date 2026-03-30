import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUsers, useUser, useCreateUser, useUpdateUser, useDeleteUser, useRestoreUser, useBulkDeleteUsers } from '../../../hooks/api/useUsers';

vi.mock('../../../lib/api', () => ({
  usersApi: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    restore: vi.fn(),
    bulkDelete: vi.fn(),
  },
}));

import { usersApi } from '../../../lib/api';

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

describe('useUsers Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useUsers', () => {
    it('should fetch users', async () => {
      (usersApi.list as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { data: [{ id: '1', email: 'test@test.com' }], total: 1 }
      });

      const { result } = renderHook(() => useUsers({}), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(usersApi.list).toHaveBeenCalled();
    });
  });

  describe('useUser', () => {
    it('should fetch single user', async () => {
      (usersApi.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { id: '1', email: 'test@test.com' }
      });

      const { result } = renderHook(() => useUser('1'), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(usersApi.get).toHaveBeenCalled();
    });
  });

  describe('useCreateUser', () => {
    it('should create user', async () => {
      (usersApi.create as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { id: '1', email: 'new@test.com' }
      });

      const { result } = renderHook(() => useCreateUser(), { wrapper: createWrapper() });

      await waitFor(async () => {
        await result.current.mutateAsync({ email: 'new@test.com' });
      });

      expect(usersApi.create).toHaveBeenCalled();
    });
  });

  describe('useUpdateUser', () => {
    it('should update user', async () => {
      (usersApi.update as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { id: '1', first_name: 'Updated' }
      });

      const { result } = renderHook(() => useUpdateUser(), { wrapper: createWrapper() });

      await waitFor(async () => {
        await result.current.mutateAsync({ id: '1', data: { first_name: 'Updated' } });
      });

      expect(usersApi.update).toHaveBeenCalled();
    });
  });

  describe('useDeleteUser', () => {
    it('should delete user', async () => {
      (usersApi.delete as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { success: true } });

      const { result } = renderHook(() => useDeleteUser(), { wrapper: createWrapper() });

      await waitFor(async () => {
        await result.current.mutateAsync('1');
      });

      expect(usersApi.delete).toHaveBeenCalledWith('1');
    });
  });

  describe('useRestoreUser', () => {
    it('should restore user', async () => {
      (usersApi.restore as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { id: '1', is_active: true }
      });

      const { result } = renderHook(() => useRestoreUser(), { wrapper: createWrapper() });

      await waitFor(async () => {
        await result.current.mutateAsync('1');
      });

      expect(usersApi.restore).toHaveBeenCalledWith('1');
    });
  });

  describe('useBulkDeleteUsers', () => {
    it('should bulk delete users', async () => {
      (usersApi.bulkDelete as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { success: true }
      });

      const { result } = renderHook(() => useBulkDeleteUsers(), { wrapper: createWrapper() });

      await waitFor(async () => {
        await result.current.mutateAsync({ ids: ['1', '2', '3'], force: true });
      });

      expect(usersApi.bulkDelete).toHaveBeenCalled();
    });
  });
});
