import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../../context/ThemeContext';
import { NotificationProvider } from '../../context/NotificationContext';
import { AuthProvider } from '../../context/AuthContext';
import InventoryPage from '../../pages/InventoryPage';
import PMSchedulesPage from '../../pages/PMSchedulesPage';
import UsersPage from '../../pages/UsersPage';
import OrganizationsPage from '../../pages/OrganizationsPage';
import ProfilePage from '../../pages/ProfilePage';

vi.mock('../../lib/api', () => ({
  authApi: {
    login: vi.fn(),
    getMe: vi.fn().mockResolvedValue({ 
      data: { id: '1', email: 'admin@demo.com', first_name: 'John', last_name: 'Doe', role: { id: '1', name: 'super_admin' }, is_active: true }
    }),
  },
  inventoryApi: { 
    list: vi.fn().mockResolvedValue({ data: { data: [], total: 0 } }),
    getStats: vi.fn().mockResolvedValue({ data: { total: 0 } })
  },
  pmSchedulesApi: { list: vi.fn().mockResolvedValue({ data: { data: [], total: 0 } }) },
  usersApi: { list: vi.fn().mockResolvedValue({ data: { data: [], total: 0 } }) },
  organizationsApi: { list: vi.fn().mockResolvedValue({ data: { data: [], total: 0 } }) },
}));

import { inventoryApi, pmSchedulesApi, usersApi, organizationsApi } from '../../lib/api';

const mockUser = {
  id: '1',
  email: 'admin@demo.com',
  first_name: 'John',
  last_name: 'Doe',
  role: { id: '1', name: 'super_admin' },
  is_active: true,
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <NotificationProvider>
            <AuthProvider initialAuth={{ user: mockUser, token: 'test-token' }}>
              {children}
            </AuthProvider>
          </NotificationProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe('Page Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('InventoryPage', () => {
    it('should render without crashing', async () => {
      const { container } = render(createWrapper()(<InventoryPage />));
      await waitFor(() => {
        expect(container).toBeInTheDocument();
      });
    });
  });

  describe('PMSchedulesPage', () => {
    it('should render without crashing', async () => {
      const { container } = render(createWrapper()(<PMSchedulesPage />));
      await waitFor(() => {
        expect(container).toBeInTheDocument();
      });
    });
  });

  describe('UsersPage', () => {
    it('should render without crashing', async () => {
      const { container } = render(createWrapper()(<UsersPage />));
      await waitFor(() => {
        expect(container).toBeInTheDocument();
      });
    });
  });

  describe('OrganizationsPage', () => {
    it('should render without crashing', async () => {
      const { container } = render(createWrapper()(<OrganizationsPage />));
      await waitFor(() => {
        expect(container).toBeInTheDocument();
      });
    });
  });

  describe('ProfilePage', () => {
    it('should render without crashing', async () => {
      const { container } = render(createWrapper()(<ProfilePage />));
      await waitFor(() => {
        expect(container).toBeInTheDocument();
      });
    });
  });
});
