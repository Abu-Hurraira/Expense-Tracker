import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { settingsApi } from '../api/client';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  currency: string;
  setCurrency: (c: string) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const syncedUserId = useRef<number | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    (localStorage.getItem('theme') as 'light' | 'dark') || 'light'
  );
  const [currency, setCurrency] = useState(user?.currency || 'PKR');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!user) {
      syncedUserId.current = null;
      return;
    }
    if (syncedUserId.current === user.userId) return;
    syncedUserId.current = user.userId;
    if (user.currency) setCurrency(user.currency);
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (stored) setTheme(stored);
    else if (user.theme) setTheme(user.theme as 'light' | 'dark');
  }, [user]);

  const toggleTheme = () => {
    setTheme(t => {
      const next = t === 'light' ? 'dark' : 'light';
      if (user) {
        settingsApi.update(currency, next).catch(() => {});
      }
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, currency, setCurrency }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

export function formatCurrency(amount: number, currency = 'PKR') {
  return new Intl.NumberFormat('en-PK', { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount);
}
