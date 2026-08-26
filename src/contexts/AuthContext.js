'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        localStorage.removeItem('token');
        setUser(null);
      }
    } catch {
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: (email || '').trim(), password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.token) localStorage.setItem('token', data.token);
        setUser(data.user);
        return { success: true, user: data.user, token: data.token };
      }
      return { success: false, error: data.message || data.error || 'Invalid credentials' };
    } catch (err) {
      console.error('Login network error:', err);
      return { success: false, error: 'Network error or server unavailable. Please try again.' };
    }
  };

  const register = async (userData) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.token) localStorage.setItem('token', data.token);
        setUser(data.user);
        return { success: true, user: data.user, token: data.token };
      }
      return { success: false, error: data.message || data.error || 'Registration failed' };
    } catch (err) {
      console.error('Register network error:', err);
      return { success: false, error: 'Network error or server unavailable. Please try again.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/';
  };

  const getToken = () => localStorage.getItem('token');

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, getToken, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
