import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../../context/ThemeContext';
import { NotificationProvider } from '../../context/NotificationContext';
import { AuthProvider } from '../../context/AuthContext';
import DashboardPage from '../../pages/DashboardPage';

vi.mock('../../lib/api', () => ({
  authApi: {
    login: vi.fn(),
    getMe: vi.fn().mockResolvedValue({ 
      data: { id: '1', email: 'admin@demo.com', first_name: 'John', last_name: 'Doe', role: { id: '1', name: 'super_admin' }, is_active: true }
    }),
  },
  analyticsApi: {
    getDashboard: vi.fn().mockResolvedValue({
      data: {
        stats: {
          total_work_orders: 25,
          in_progress_work_orders: 5,
          completed_work_orders: 15,
          pending_work_orders: 5,
          overdue_pms: 2,
          total_assets: 50,
          active_pm_schedules: 10,
          completion_rate: 75,
        },
        wo_by_status: [],
        wo_by_priority: [],
        recent_work_orders: [],
      },
    }),
  },
  inventoryApi: {
    getStats: vi.fn().mockResolvedValue({ data: { low_stock_count: 0 } }),
  },
}));

import { analyticsApi, inventoryApi } from '../../lib/api';

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

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', async () => {
    const { container } = render(createWrapper()(<DashboardPage />));
    await waitFor(() => {
      expect(container).toBeInTheDocument();
    });
  });
});
