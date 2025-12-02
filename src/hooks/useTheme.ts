import { useState, useEffect } from 'react';

export const useTheme = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    // Initialize from localStorage if available (client-side)
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('app_theme') as 'light' | 'dark' | null;
      if (savedTheme) {
        return savedTheme;
      }
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return 'light';
  });
  const [showSettingsOverlay, setShowSettingsOverlay] = useState(false);

  // Save theme to localStorage and update DOM
  useEffect(() => {
    localStorage.setItem('app_theme', theme);

    // Update HTML tag for Tailwind dark mode (required for dark: modifiers)
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Apply theme class to body for global styles if needed (keeping your preference)
    document.body.className = theme;
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Listen for changes in other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'app_theme' && e.newValue) {
        setTheme(e.newValue as 'light' | 'dark');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return {
    theme,
    setTheme,
    toggleTheme,
    showSettingsOverlay,
    setShowSettingsOverlay,
  };
};

