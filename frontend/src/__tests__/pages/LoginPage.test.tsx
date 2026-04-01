import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../../pages/LoginPage';
import { ThemeProvider } from '../../context/ThemeContext';
import { NotificationProvider } from '../../context/NotificationContext';

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock('../../lib/api', () => ({
  authApi: {
    login: vi.fn(),
    getMe: vi.fn(),
  },
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render login page without crashing', () => {
      const { container } = render(
        <BrowserRouter>
          <ThemeProvider>
            <NotificationProvider>
              <LoginPage />
            </NotificationProvider>
          </ThemeProvider>
        </BrowserRouter>
      );
      expect(container).toBeInTheDocument();
    });

    it('should display email input field', () => {
      render(
        <BrowserRouter>
          <ThemeProvider>
            <NotificationProvider>
              <LoginPage />
            </NotificationProvider>
          </ThemeProvider>
        </BrowserRouter>
      );
      expect(screen.getByTestId('login-email-input')).toBeInTheDocument();
    });

    it('should display password input field', () => {
      render(
        <BrowserRouter>
          <ThemeProvider>
            <NotificationProvider>
              <LoginPage />
            </NotificationProvider>
          </ThemeProvider>
        </BrowserRouter>
      );
      expect(screen.getByTestId('login-password-input')).toBeInTheDocument();
    });

    it('should display submit button', () => {
      render(
        <BrowserRouter>
          <ThemeProvider>
            <NotificationProvider>
              <LoginPage />
            </NotificationProvider>
          </ThemeProvider>
        </BrowserRouter>
      );
      expect(screen.getByTestId('login-submit-btn')).toBeInTheDocument();
    });

    it('should display welcome back text', () => {
      render(
        <BrowserRouter>
          <ThemeProvider>
            <NotificationProvider>
              <LoginPage />
            </NotificationProvider>
          </ThemeProvider>
        </BrowserRouter>
      );
      expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    });

    it('should display FMS branding', () => {
      render(
        <BrowserRouter>
          <ThemeProvider>
            <NotificationProvider>
              <LoginPage />
            </NotificationProvider>
          </ThemeProvider>
        </BrowserRouter>
      );
      expect(screen.getAllByText(/FMS/i)[0]).toBeInTheDocument();
    });
  });
});
