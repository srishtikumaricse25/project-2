'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user, getToken } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const token = getToken();
      const res = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // Silently fail
    }
  }, [user, getToken]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = async (notificationId) => {
    try {
      const token = getToken();
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: 1 } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // Silently fail
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = getToken();
      await fetch('/api/notifications/read-all', {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch {
      // Silently fail
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
