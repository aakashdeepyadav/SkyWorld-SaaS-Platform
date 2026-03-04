import { createContext, useContext, useEffect, useRef, useState } from 'react';

const ThemeContext = createContext(null);
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

/**
 * ThemeProvider — follows system appearance by default,
 * but allows manual override via toggleTheme.
 */
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );
  const userOverrideRef = useRef(false);

  // Listen for system preference changes — only if user hasn't manually toggled
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      if (!userOverrideRef.current) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    userOverrideRef.current = true;
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };
  const isDark = theme === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark }}>{children}</ThemeContext.Provider>
  );
};
