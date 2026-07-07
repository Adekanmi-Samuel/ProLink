'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import api from '../lib/api';

type Theme = 'dark' | 'light';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  userType: string | null;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  toggleTheme: () => {},
  userType: null,
});

export const useTheme = () => useContext(ThemeContext);

const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? match[1] : null;
};

const setCookie = (name: string, value: string) => {
  document.cookie = `${name}=${value}; path=/; max-age=31536000; SameSite=Lax`;
};

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [userType, setUserType] = useState<string | null>(null);
  const [themeInjected, setThemeInjected] = useState(false);
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  // Initialize theme: saved cookie > device preference > dark fallback
  useEffect(() => {
    const saved = getCookie('theme') as Theme | null;
    if (saved === 'light' || saved === 'dark') {
      setTheme(saved);
    } else {
      // No saved preference — detect from device
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
    setMounted(true);
  }, []);

  // Apply theme class to html element
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(theme);
    // Also set the attribute that globals.css :root already covers
    document.documentElement.setAttribute('data-theme', theme);
    setCookie('theme', theme);
  }, [theme, mounted]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  // Fetch user type for role-based theming (only if logged in)
  useEffect(() => {
    const applyTheme = async () => {
      const { hasAuthCookie } = require('../lib/api');
      const hasCookie = hasAuthCookie();
      if (!hasCookie) {
        setThemeInjected(true);
        return;
      }

      try {
        const { data } = await api.get('/profiles/me');
        document.body.classList.remove('theme-client', 'theme-provider');
        if (data.user_type === 'client') {
          document.body.classList.add('theme-client');
        } else {
          document.body.classList.add('theme-provider');
        }
        setUserType(data.user_type);
      } catch {
        document.body.classList.remove('theme-client', 'theme-provider');
        setUserType(null);
      }
      setThemeInjected(true);
    };

    if (!themeInjected || pathname) {
      applyTheme();
    }
  }, [pathname, themeInjected]);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, userType }}>
      {children}
    </ThemeContext.Provider>
  );
}
