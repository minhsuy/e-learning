'use client';

import React, { createContext, useContext, useEffect, useCallback, useMemo } from 'react';
import { Theme, ResolvedTheme, ThemeContextType } from '@/types/theme';

const STORAGE_KEY = 'tmdemy-theme';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  if (typeof window === 'undefined') return () => {};

  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) callback();
  };
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handleMedia = () => callback();

  window.addEventListener('storage', handleStorage);
  mediaQuery.addEventListener('change', handleMedia);

  return () => {
    listeners.delete(callback);
    window.removeEventListener('storage', handleStorage);
    mediaQuery.removeEventListener('change', handleMedia);
  };
}

function getThemeSnapshot(): Theme {
  if (typeof window === 'undefined') return 'system';
  try {
    const val = localStorage.getItem(STORAGE_KEY) as Theme;
    if (val === 'light' || val === 'dark' || val === 'system') return val;
  } catch {
    // LocalStorage blocked
  }
  return 'system';
}

function getServerThemeSnapshot(): Theme {
  return 'system';
}

function getSystemSnapshot(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getServerSystemSnapshot(): ResolvedTheme {
  return 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = React.useSyncExternalStore(subscribe, getThemeSnapshot, getServerThemeSnapshot);
  const systemTheme = React.useSyncExternalStore(subscribe, getSystemSnapshot, getServerSystemSnapshot);

  const resolvedTheme: ResolvedTheme = theme === 'system' ? systemTheme : theme;

  // Sync DOM documentElement with resolvedTheme
  useEffect(() => {
    if (resolvedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [resolvedTheme]);

  // Handler to set theme
  const setTheme = useCallback((newTheme: Theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch {
      // Storage write error
    }
    notify();
  }, []);

  const value = useMemo<ThemeContextType>(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
    }),
    [theme, resolvedTheme, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
