import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { ThemeProvider, useTheme } from '../../context/ThemeContext';

const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

const TestComponent = () => {
  const { theme, toggleTheme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <button onClick={toggleTheme} data-testid="toggle-btn">Toggle</button>
      <button onClick={() => setTheme('light')} data-testid="set-light-btn">Set Light</button>
      <button onClick={() => setTheme('dark')} data-testid="set-dark-btn">Set Dark</button>
    </div>
  );
};

describe('ThemeContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should use system preference when no stored theme', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );
      
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    });

    it('should use stored theme preference', () => {
      mockLocalStorage.getItem.mockReturnValue('light');
      
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );
      
      expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
    });
  });

  describe('toggleTheme', () => {
    it('should toggle from light to dark', async () => {
      mockLocalStorage.getItem.mockReturnValue('light');
      
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );
      
      expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
      
      await act(async () => {
        screen.getByTestId('toggle-btn').click();
      });
      
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    });

    it('should toggle from dark to light', async () => {
      mockLocalStorage.getItem.mockReturnValue('dark');
      
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );
      
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
      
      await act(async () => {
        screen.getByTestId('toggle-btn').click();
      });
      
      expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
    });
  });

  describe('setTheme', () => {
    it('should set theme to light', async () => {
      mockLocalStorage.getItem.mockReturnValue('dark');
      
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );
      
      await act(async () => {
        screen.getByTestId('set-light-btn').click();
      });
      
      expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'light');
    });

    it('should set theme to dark', async () => {
      mockLocalStorage.getItem.mockReturnValue('light');
      
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );
      
      await act(async () => {
        screen.getByTestId('set-dark-btn').click();
      });
      
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
    });
  });

  describe('useTheme Hook', () => {
    it('should throw error when used outside ThemeProvider', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(<TestComponent />);
      }).toThrow('useTheme must be used within a ThemeProvider');
      
      consoleError.mockRestore();
    });
  });
});
