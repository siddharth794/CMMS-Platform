import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../../context/ThemeContext';
import { NotificationProvider } from '../../context/NotificationContext';
import AssetsBulkUploadDialog from '../../components/AssetsBulkUploadDialog';
import InventoryBulkUploadDialog from '../../components/InventoryBulkUploadDialog';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
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

describe('Bulk Upload Dialogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AssetsBulkUploadDialog', () => {
    it('should render without crashing', () => {
      const { container } = render(
        createWrapper()(
          <AssetsBulkUploadDialog open={true} onClose={() => {}} />
        )
      );
      expect(container).toBeInTheDocument();
    });
  });

  describe('InventoryBulkUploadDialog', () => {
    it('should render without crashing', () => {
      const { container } = render(
        createWrapper()(
          <InventoryBulkUploadDialog open={true} onClose={() => {}} />
        )
      );
      expect(container).toBeInTheDocument();
    });
  });
});
