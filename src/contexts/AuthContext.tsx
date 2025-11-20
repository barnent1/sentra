'use client';

import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // API routes are at same origin (Vercel Functions / Next.js API routes)
  const API_URL = '';

  const saveTokens = (accessToken: string, refreshToken: string) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  };

  const clearTokens = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  const getAccessToken = () => localStorage.getItem('accessToken');
  const getRefreshToken = () => localStorage.getItem('refreshToken');

  const fetchCurrentUser = useCallback(async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch user');

      const data = await response.json();
      setUser(data.user);
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      clearTokens();
      setUser(null);
    }
  }, [API_URL]);

  const logout = useCallback(async () => {
    clearTokens();
    setUser(null);
    router.push('/login');
  }, [router]);

  const refreshToken = useCallback(async () => {
    const refresh = getRefreshToken();
    if (!refresh) throw new Error('No refresh token');

    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refresh }),
    });

    if (!response.ok) {
      clearTokens();
      setUser(null);
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    saveTokens(data.token, data.refreshToken);
    return data.token;
  }, [API_URL]);

  const login = async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();
    saveTokens(data.token, data.refreshToken);
    setUser(data.user);
  };

  const signup = async (email: string, password: string, name?: string) => {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Signup failed');
    }

    const data = await response.json();
    saveTokens(data.token, data.refreshToken);
    setUser(data.user);
  };

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = getAccessToken();
      if (token) {
        await fetchCurrentUser(token);
      }
      setLoading(false);
    };

    checkAuth();
  }, [fetchCurrentUser]);

  // Auto-refresh token every 45 minutes (tokens expire in 1 hour)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      try {
        await refreshToken();
      } catch (error) {
        console.error('Token refresh failed:', error);
        logout();
      }
    }, 45 * 60 * 1000); // 45 minutes

    return () => clearInterval(interval);
  }, [user, refreshToken, logout]);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
}
