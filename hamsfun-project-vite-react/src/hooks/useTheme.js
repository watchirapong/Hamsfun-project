/**
 * Theme Hook with performance optimizations
 * Optimized for 10,000+ concurrent users
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

const THEME_STORAGE_KEY = 'app_theme';

/**
 * Theme Manager - Singleton for theme operations
 */
class ThemeManager {
  constructor() {
    this.listeners = new Set();
  }

  getInitialTheme() {
    if (typeof window === 'undefined') return 'light';
    
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  }

  applyTheme(theme) {
    if (typeof document === 'undefined') return;
    
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    document.body.className = theme;
  }

  saveTheme(theme) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(newTheme) {
    this.listeners.forEach(listener => listener(newTheme));
  }
}

const themeManager = new ThemeManager();

export const useTheme = () => {
  const [theme, setTheme] = useState(() => themeManager.getInitialTheme());
  const [showSettingsOverlay, setShowSettingsOverlay] = useState(false);

  // Save theme to localStorage and update DOM
  useEffect(() => {
    themeManager.saveTheme(theme);
    themeManager.applyTheme(theme);
  }, [theme]);

  // Memoized toggle function
  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  // Memoized setTheme wrapper
  const setThemeMemoized = useCallback((newTheme) => {
    setTheme(newTheme);
  }, []);

  // Listen for changes in other tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === THEME_STORAGE_KEY && e.newValue) {
        const newTheme = e.newValue === 'light' || e.newValue === 'dark' ? e.newValue : 'light';
        setTheme(newTheme);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Memoized return value
  return useMemo(() => ({
    theme,
    setTheme: setThemeMemoized,
    toggleTheme,
    showSettingsOverlay,
    setShowSettingsOverlay,
  }), [theme, toggleTheme, showSettingsOverlay, setThemeMemoized]);
};

