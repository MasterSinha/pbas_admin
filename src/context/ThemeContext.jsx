import { createContext, useContext, useMemo, useState } from 'react';

const STORAGE_KEY = 'admin-ui-theme';
const ThemeContext = createContext(null);

function getInitialTheme() {
  if (typeof window === 'undefined') return 'dark';

  const saved = window.localStorage.getItem(STORAGE_KEY);
  const theme = saved === 'light' || saved === 'dark' ? saved : 'dark';
  document.documentElement.dataset.theme = theme;
  return theme;
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  const value = useMemo(() => ({
    theme,
    isDark: theme === 'dark',
    toggleTheme() {
      setTheme(current => {
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.dataset.theme = next;
        window.localStorage.setItem(STORAGE_KEY, next);
        return next;
      });
    },
  }), [theme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
