import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../../context/ThemeContext';
import { NotificationProvider } from '../../context/NotificationContext';
import { AuthProvider } from '../../context/AuthContext';
import WorkOrdersPage from '../../pages/WorkOrdersPage';

vi.mock('../../lib/api', () => ({
  authApi: {
    login: vi.fn(),
    getMe: vi.fn().mockResolvedValue({ 
      data: { id: '1', email: 'admin@demo.com', first_name: 'John', last_name: 'Doe', role: { id: '1', name: 'super_admin' }, is_active: true }
    }),
  },
  workOrdersApi: {
    list: vi.fn().mockResolvedValue({ data: { data: [], total: 0 } }),
    delete: vi.fn(),
    bulkDelete: vi.fn(),
  },
}));

import { workOrdersApi } from '../../lib/api';

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

describe('WorkOrdersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', async () => {
    const { container } = render(createWrapper()(<WorkOrdersPage />));
    await waitFor(() => {
      expect(container).toBeInTheDocument();
    });
  });
});
