'use client';

import React, { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react';

const ThemeContext = createContext({
  theme: 'dark',
  mounted: false,
  setTheme: () => {},
  toggleTheme: () => {}
});

function subscribe(callback) {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

function getSnapshot() {
  if (typeof window === 'undefined') return 'dark';
  try {
    const saved = localStorage.getItem('crm_theme');
    return saved === 'light' || saved === 'dark' ? saved : 'dark';
  } catch {
    return 'dark';
  }
}

function getServerSnapshot() {
  return 'dark';
}

export function ThemeProvider({ children }) {
  const [localTheme, setLocalTheme] = useState(null);
  const externalTheme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const theme = localTheme || externalTheme;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Mark component as mounted to safely render client-dependent elements
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const changeTheme = (newTheme) => {
    setLocalTheme(newTheme);
    try {
      localStorage.setItem('crm_theme', newTheme);
      window.dispatchEvent(new Event('storage'));
    } catch {
      // ignore
    }
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    changeTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, mounted, setTheme: changeTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
