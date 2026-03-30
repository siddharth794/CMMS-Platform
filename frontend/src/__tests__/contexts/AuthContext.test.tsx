import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../../context/ThemeContext';
import { NotificationProvider } from '../../context/NotificationContext';
import { AuthProvider, useAuth } from '../../context/AuthContext';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock('axios', () => {
  const mockUser = {
    id: '1',
    email: 'admin@demo.com',
    first_name: 'John',
    last_name: 'Doe',
    role: { id: '1', name: 'super_admin' },
    is_active: true,
  };
  
  return {
    default: {
      get: vi.fn().mockResolvedValue({ data: mockUser }),
      post: vi.fn().mockResolvedValue({ data: { access_token: 'mock-token', user: mockUser } }),
      defaults: {
        headers: {
          common: {}
        }
      }
    }
  };
});

const TestComponent = () => {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="loading">{auth.loading ? 'loading' : 'loaded'}</span>
      <span data-testid="has-user">{auth.user ? 'yes' : 'no'}</span>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'test-token');
  });

  describe('Initial State', () => {
    it('should initialize with user when token provided', async () => {
      render(
        <BrowserRouter>
          <QueryClientProvider client={new QueryClient()}>
            <ThemeProvider>
              <NotificationProvider>
                <AuthProvider>
                  <TestComponent />
                </AuthProvider>
              </NotificationProvider>
            </ThemeProvider>
          </QueryClientProvider>
        </BrowserRouter>
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('has-user')).toHaveTextContent('yes');
      });
    });
  });
});
