import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Initialize from localStorage synchronously to avoid flicker on refresh
  const [isDark, setIsDark] = useState(() => {
    try {
      const stored = localStorage.getItem('raffle_theme');
      if (stored === 'dark') return true;
      if (stored === 'light') return false;
      // fallback to system preference
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch (_) {
      return false;
    }
  });

  // Apply theme class and persist preference
  useEffect(() => {
    try {
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('raffle_theme', isDark ? 'dark' : 'light');
    } catch (_) {
      // ignore
    }
  }, [isDark]);

  // Optional: keep in sync with system changes if user hasn't explicitly chosen
  useEffect(() => {
    const mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    if (!mq) return;
    const handler = e => {
      const stored = localStorage.getItem('raffle_theme');
      // only auto-switch if user never stored a preference
      if (!stored) setIsDark(!!e.matches);
    };
    if (mq.addEventListener) mq.addEventListener('change', handler);
    else if (mq.addListener) mq.addListener(handler);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', handler);
      else if (mq.removeListener) mq.removeListener(handler);
    };
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const value = {
    isDark,
    toggleTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
