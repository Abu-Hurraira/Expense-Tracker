import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { AuthResponse } from '../api/types';
import { authApi } from '../api/client';

interface AuthContextType {
  user: AuthResponse | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthResponse | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  useEffect(() => {
    if (!user) return;
    const expiry = new Date(user.expiresAt).getTime() - Date.now();
    if (expiry <= 0) { logout(); return; }
    const timer = setTimeout(logout, expiry);
    return () => clearTimeout(timer);
  }, [user, logout]);

  const login = async (username: string, password: string) => {
    const { data } = await authApi.login(username, password);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data));
    setUser(data);
  };

  const register = async (username: string, email: string, password: string) => {
    const { data } = await authApi.register(username, email, password);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data));
    setUser(data);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
