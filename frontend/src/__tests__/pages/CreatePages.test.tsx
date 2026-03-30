import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../../context/ThemeContext';
import { NotificationProvider } from '../../context/NotificationContext';
import { AuthProvider } from '../../context/AuthContext';
import CreateWorkOrderPage from '../../pages/CreateWorkOrderPage';
import CreateAssetPage from '../../pages/CreateAssetPage';
import CreateUserPage from '../../pages/CreateUserPage';
import InventoryCreatePage from '../../pages/InventoryCreatePage';
import CreatePMSchedulePage from '../../pages/CreatePMSchedulePage';

vi.mock('../../lib/api', () => ({
  workOrdersApi: { create: vi.fn().mockResolvedValue({ data: { id: '1' } }) },
  assetsApi: { create: vi.fn().mockResolvedValue({ data: { id: '1' } }) },
  usersApi: { create: vi.fn().mockResolvedValue({ data: { id: '1' } }) },
  inventoryApi: { create: vi.fn().mockResolvedValue({ data: { id: '1' } }) },
  pmSchedulesApi: { create: vi.fn().mockResolvedValue({ data: { id: '1' } }) },
}));

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

describe('Create Pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('CreateWorkOrderPage', () => {
    it('should render without crashing', async () => {
      const { container } = render(createWrapper()(<CreateWorkOrderPage />));
      expect(container).toBeInTheDocument();
    });
  });

  describe('CreateAssetPage', () => {
    it('should render without crashing', async () => {
      const { container } = render(createWrapper()(<CreateAssetPage />));
      expect(container).toBeInTheDocument();
    });
  });

  describe('CreateUserPage', () => {
    it('should render without crashing', async () => {
      const { container } = render(createWrapper()(<CreateUserPage />));
      expect(container).toBeInTheDocument();
    });
  });

  describe('InventoryCreatePage', () => {
    it('should render without crashing', async () => {
      const { container } = render(createWrapper()(<InventoryCreatePage />));
      expect(container).toBeInTheDocument();
    });
  });

  describe('CreatePMSchedulePage', () => {
    it('should render without crashing', async () => {
      const { container } = render(createWrapper()(<CreatePMSchedulePage />));
      expect(container).toBeInTheDocument();
    });
  });
});
