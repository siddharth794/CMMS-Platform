import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../../context/ThemeContext';
import { NotificationProvider } from '../../context/NotificationContext';
import Layout from '../../components/Layout';

vi.mock('../../lib/api', () => ({
  authApi: {
    getMe: vi.fn().mockResolvedValue({
      data: {
        id: '1',
        email: 'admin@demo.com',
        first_name: 'John',
        last_name: 'Doe',
        role: { id: '1', name: 'super_admin' },
        is_active: true,
      }
    }),
  },
}));

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
            {children}
          </NotificationProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe('Layout Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render layout without crashing', async () => {
      const { container } = render(createWrapper()(<Layout />));
      expect(container).toBeInTheDocument();
    });
  });
});
