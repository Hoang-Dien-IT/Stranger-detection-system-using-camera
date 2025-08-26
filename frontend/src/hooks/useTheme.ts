import { useState, useEffect } from 'react';

export type Theme = 'light' | 'dark' | 'system';

interface UseThemeReturn {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  systemTheme: 'light' | 'dark';
  resolvedTheme: 'light' | 'dark';
}

export const useTheme = (): UseThemeReturn => {
  const [theme, setThemeState] = useState<Theme>('system');
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');

  // Detect system theme preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const updateSystemTheme = () => {
      setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    };

    // Set initial system theme
    updateSystemTheme();

    // Listen for changes
    mediaQuery.addEventListener('change', updateSystemTheme);

    return () => mediaQuery.removeEventListener('change', updateSystemTheme);
  }, []);

  // Load saved theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setThemeState(savedTheme);
    }
  }, []);

  // Apply theme changes
  useEffect(() => {
    const resolvedTheme = theme === 'system' ? systemTheme : theme;
    
    // Apply theme to document
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(resolvedTheme);
    document.documentElement.setAttribute('data-theme', resolvedTheme);
    
    // For compatibility with some components that check for 'dark' class
    if (resolvedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme, systemTheme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const resolvedTheme = theme === 'system' ? systemTheme : theme;

  return {
    theme,
    setTheme,
    systemTheme,
    resolvedTheme
  };
};

// Additional theme utilities
export const useThemeColors = () => {
  const { resolvedTheme } = useTheme();
  
  return {
    isDark: resolvedTheme === 'dark',
    isLight: resolvedTheme === 'light',
    
    // Common color utilities
    getBgClass: (lightClass: string, darkClass: string) => 
      resolvedTheme === 'dark' ? darkClass : lightClass,
    
    getTextClass: (lightClass: string, darkClass: string) => 
      resolvedTheme === 'dark' ? darkClass : lightClass,
    
    getBorderClass: (lightClass: string, darkClass: string) => 
      resolvedTheme === 'dark' ? darkClass : lightClass,
  };
};

export default useTheme;