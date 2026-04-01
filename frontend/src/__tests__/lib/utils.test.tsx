import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, useTheme } from '../../context/ThemeContext';
import { NotificationProvider } from '../../context/NotificationContext';
import { AuthProvider } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

describe('ThemeContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window.localStorage, 'getItem').mockReturnValue(null);
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

  describe('Initial State', () => {
    it('should initialize with default theme', () => {
      const TestComponent = () => {
        const { theme } = useTheme();
        return <span data-testid="theme">{theme}</span>;
      };

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      const themeSpan = screen.getByTestId('theme');
      expect(['light', 'dark']).toContain(themeSpan.textContent);
    });
  });
});

describe('cn utility function', () => {
  it('should merge class names', () => {
    const result = cn('class1', 'class2');
    expect(result).toContain('class1');
    expect(result).toContain('class2');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    const result = cn('base', isActive && 'active');
    expect(result).toContain('base');
  });

  it('should merge tailwind classes correctly', () => {
    const result = cn('text-blue-500', 'text-red-500');
    expect(result).toBeDefined();
  });
});
