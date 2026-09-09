'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';

const AuthContext = createContext({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  hasRole: () => false
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const handleUnauthorizedEvent = () => {
      setUser(null);
      setToken(null);
      router.push('/login');
    };
    window.addEventListener('crm:unauthorized', handleUnauthorizedEvent);
    return () => window.removeEventListener('crm:unauthorized', handleUnauthorizedEvent);
  }, [router]);

  useEffect(() => {
    let ignore = false;

    async function restoreSession() {
      const storedToken = typeof window !== 'undefined' ? localStorage.getItem('crm_token') : null;
      const storedUser = typeof window !== 'undefined' ? localStorage.getItem('crm_user') : null;

      if (!storedToken) {
        if (!ignore) setLoading(false);
        return;
      }

      if (storedUser) {
        try {
          if (!ignore) setUser(JSON.parse(storedUser));
        } catch {
          localStorage.removeItem('crm_user');
        }
      }
      if (!ignore) setToken(storedToken);

      try {
        const data = await fetchApi('/api/auth/me');
        if (!ignore) {
          if (data.success && data.user) {
            setUser(data.user);
            localStorage.setItem('crm_user', JSON.stringify(data.user));
          } else {
            setUser(null);
            setToken(null);
            localStorage.removeItem('crm_token');
            localStorage.removeItem('crm_user');
          }
        }
      } catch (err) {
        console.error('Session check error:', err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    restoreSession();

    return () => {
      ignore = true;
    };
  }, []);

  const login = async (email, password) => {
    try {
      const data = await fetchApi('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (data.success) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('crm_token', data.token);
        localStorage.setItem('crm_user', JSON.stringify(data.user));
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Đăng nhập không thành công' };
      }
    } catch (err) {
      return { success: false, error: err.message || 'Lỗi kết nối' };
    }
  };

  const logout = async () => {
    try {
      await fetchApi('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('crm_token');
      localStorage.removeItem('crm_user');
      router.push('/login');
    }
  };

  const hasRole = (allowedRoles = []) => {
    if (!user) return false;
    if (user.role === 'admin') return true; // Admin has universal access
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
