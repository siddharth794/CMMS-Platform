import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import { ThemeProvider } from '../../context/ThemeContext';
import { NotificationProvider } from '../../context/NotificationContext';
import { SocketProvider } from '../../context/SocketContext';
import { SocketEvents } from '../../context/SocketEvents';
import { Toaster } from 'sonner';

interface WrapperProps {
  children: ReactNode;
  initialAuth?: {
    user?: any;
    token?: string | null;
  };
}

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

const AllProviders = ({ children, initialAuth }: WrapperProps) => {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <NotificationProvider>
          <BrowserRouter>
            <AuthProvider {...initialAuth}>
              <SocketProvider>
                <SocketEvents />
                {children}
                <Toaster position="top-right" />
              </SocketProvider>
            </AuthProvider>
          </BrowserRouter>
        </NotificationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  {
    initialAuth = {},
    ...renderOptions
  }: { initialAuth?: { user?: any; token?: string | null } } & Omit<RenderOptions, 'wrapper'> = {}
) => {
  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders initialAuth={initialAuth}>{children}</AllProviders>
    ),
    ...renderOptions,
  });
};

export * from '@testing-library/react';
export { customRender as render };
export { createTestQueryClient };
