import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../../context/ThemeContext';
import { NotificationProvider } from '../../context/NotificationContext';
import { AuthProvider } from '../../context/AuthContext';
import AnalyticsPage from '../../pages/AnalyticsPage';
import TechnicianDashboardPage from '../../pages/TechnicianDashboardPage';
import TechnicianAnalyticsPage from '../../pages/TechnicianAnalyticsPage';
import RequesterDashboardPage from '../../pages/RequesterDashboardPage';
import PMScheduleDetailPage from '../../pages/PMScheduleDetailPage';

vi.mock('../../lib/api', () => ({
  analyticsApi: {
    getDashboard: vi.fn().mockResolvedValue({ data: {} }),
    getComprehensive: vi.fn().mockResolvedValue({ data: {} }),
    getTechnicianDashboard: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

import { analyticsApi } from '../../lib/api';

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

describe('Analytics and Role-Based Pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AnalyticsPage', () => {
    it('should render without crashing', async () => {
      const { container } = render(createWrapper()(<AnalyticsPage />));
      expect(container).toBeInTheDocument();
    });
  });

  describe('TechnicianDashboardPage', () => {
    it('should render without crashing', async () => {
      const { container } = render(createWrapper()(<TechnicianDashboardPage />));
      expect(container).toBeInTheDocument();
    });
  });

  describe('TechnicianAnalyticsPage', () => {
    it('should render without crashing', async () => {
      const { container } = render(createWrapper()(<TechnicianAnalyticsPage />));
      expect(container).toBeInTheDocument();
    });
  });

  describe('RequesterDashboardPage', () => {
    it('should render without crashing', async () => {
      const { container } = render(createWrapper()(<RequesterDashboardPage />));
      expect(container).toBeInTheDocument();
    });
  });

  describe('PMScheduleDetailPage', () => {
    it('should render without crashing', async () => {
      const { container } = render(createWrapper()(<PMScheduleDetailPage />));
      expect(container).toBeInTheDocument();
    });
  });
});
