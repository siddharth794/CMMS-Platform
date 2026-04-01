import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { NotificationProvider, useNotification } from '../../context/NotificationContext';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

const TestComponent = () => {
  const {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAll
  } = useNotification();

  return (
    <div>
      <span data-testid="notification-count">{notifications.length}</span>
      <span data-testid="unread-count">{unreadCount}</span>
      <button onClick={() => addNotification('success', 'Test success')}>Add Success</button>
      <button onClick={() => addNotification('error', 'Test error')}>Add Error</button>
      <button onClick={() => addNotification('warning', 'Test warning')}>Add Warning</button>
      <button onClick={() => notifications[0] && markAsRead(notifications[0].id)}>Mark First Read</button>
      <button onClick={markAllAsRead}>Mark All Read</button>
      <button onClick={clearAll}>Clear All</button>
      <div data-testid="notifications-list">
        {notifications.map((n) => (
          <span key={n.id} data-testid={`notification-${n.id}`}>{n.message}</span>
        ))}
      </div>
    </div>
  );
};

describe('NotificationContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('[]');
    mockLocalStorage.setItem.mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should start with empty notifications', () => {
      mockLocalStorage.getItem.mockReturnValue('[]');
      
      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );
      
      expect(screen.getByTestId('notification-count')).toHaveTextContent('0');
      expect(screen.getByTestId('unread-count')).toHaveTextContent('0');
    });

    it('should load notifications from localStorage', () => {
      const storedNotifications = [
        { id: '1', message: 'Stored notification', type: 'success', read: false, timestamp: new Date().toISOString() }
      ];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedNotifications));
      
      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );
      
      expect(screen.getByTestId('notification-count')).toHaveTextContent('1');
    });
  });

  describe('addNotification', () => {
    it('should add success notification', async () => {
      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );
      
      await act(async () => {
        screen.getByRole('button', { name: 'Add Success' }).click();
      });
      
      expect(screen.getByTestId('notification-count')).toHaveTextContent('1');
      expect(screen.getByTestId('unread-count')).toHaveTextContent('1');
    });

    it('should add error notification', async () => {
      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );
      
      await act(async () => {
        screen.getByRole('button', { name: 'Add Error' }).click();
      });
      
      expect(screen.getByTestId('notification-count')).toHaveTextContent('1');
    });

    it('should add warning notification', async () => {
      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );
      
      await act(async () => {
        screen.getByRole('button', { name: 'Add Warning' }).click();
      });
      
      expect(screen.getByTestId('notification-count')).toHaveTextContent('1');
    });

    it('should limit notifications to 50', async () => {
      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );
      
      for (let i = 0; i < 55; i++) {
        await act(async () => {
          screen.getByRole('button', { name: 'Add Success' }).click();
        });
      }
      
      expect(screen.getByTestId('notification-count')).toHaveTextContent('50');
    });

    it('should save notifications to localStorage', async () => {
      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );
      
      await act(async () => {
        screen.getByRole('button', { name: 'Add Success' }).click();
      });
      
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );
      
      await act(async () => {
        screen.getByRole('button', { name: 'Add Success' }).click();
      });
      
      expect(screen.getByTestId('unread-count')).toHaveTextContent('1');
      
      await act(async () => {
        screen.getByRole('button', { name: 'Mark First Read' }).click();
      });
      
      expect(screen.getByTestId('unread-count')).toHaveTextContent('0');
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );
      
      await act(async () => {
        screen.getByRole('button', { name: 'Add Success' }).click();
        screen.getByRole('button', { name: 'Add Error' }).click();
      });
      
      expect(screen.getByTestId('unread-count')).toHaveTextContent('2');
      
      await act(async () => {
        screen.getByRole('button', { name: 'Mark All Read' }).click();
      });
      
      expect(screen.getByTestId('unread-count')).toHaveTextContent('0');
    });
  });

  describe('clearAll', () => {
    it('should clear all notifications', async () => {
      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );
      
      await act(async () => {
        screen.getByRole('button', { name: 'Add Success' }).click();
        screen.getByRole('button', { name: 'Add Error' }).click();
      });
      
      expect(screen.getByTestId('notification-count')).toHaveTextContent('2');
      
      await act(async () => {
        screen.getByRole('button', { name: 'Clear All' }).click();
      });
      
      expect(screen.getByTestId('notification-count')).toHaveTextContent('0');
    });
  });

  describe('useNotification Hook', () => {
    it('should throw error when used outside NotificationProvider', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(<TestComponent />);
      }).toThrow('useNotification must be used within a NotificationProvider');
      
      consoleError.mockRestore();
    });
  });
});
