import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../../context/ThemeContext';
import { NotificationProvider } from '../../context/NotificationContext';
import { AuthProvider } from '../../context/AuthContext';
import WorkOrderDetailPage from '../../pages/WorkOrderDetailPage';
import AssetDetailPage from '../../pages/AssetDetailPage';
import InventoryDetailPage from '../../pages/InventoryDetailPage';
import UserDetailPage from '../../pages/UserDetailPage';
import OrganizationDetailPage from '../../pages/OrganizationDetailPage';

vi.mock('../../lib/api', () => ({
  workOrdersApi: { 
    get: vi.fn().mockResolvedValue({ data: { id: '1', title: 'Test WO' } }), 
    getComments: vi.fn().mockResolvedValue({ data: [] }), 
    getUsedParts: vi.fn().mockResolvedValue({ data: [] }) 
  },
  assetsApi: { get: vi.fn().mockResolvedValue({ data: { id: '1', name: 'Test Asset' } }) },
  inventoryApi: { get: vi.fn().mockResolvedValue({ data: { id: '1', name: 'Test Item' } }) },
  usersApi: { get: vi.fn().mockResolvedValue({ data: { id: '1', name: 'Test User' } }) },
  organizationsApi: { get: vi.fn().mockResolvedValue({ data: { id: '1', name: 'Test Org' } }) },
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

describe('Detail Pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('WorkOrderDetailPage', () => {
    it('should render without crashing', async () => {
      const { container } = render(createWrapper()(<WorkOrderDetailPage />));
      expect(container).toBeInTheDocument();
    });
  });

  describe('AssetDetailPage', () => {
    it('should render without crashing', async () => {
      const { container } = render(createWrapper()(<AssetDetailPage />));
      expect(container).toBeInTheDocument();
    });
  });

  describe('InventoryDetailPage', () => {
    it('should render without crashing', async () => {
      const { container } = render(createWrapper()(<InventoryDetailPage />));
      expect(container).toBeInTheDocument();
    });
  });

  describe('UserDetailPage', () => {
    it('should render without crashing', async () => {
      const { container } = render(createWrapper()(<UserDetailPage />));
      expect(container).toBeInTheDocument();
    });
  });

  describe('OrganizationDetailPage', () => {
    it('should render without crashing', async () => {
      const { container } = render(createWrapper()(<OrganizationDetailPage />));
      expect(container).toBeInTheDocument();
    });
  });
});
