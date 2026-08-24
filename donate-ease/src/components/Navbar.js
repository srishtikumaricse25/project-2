'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';

export default function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const notifRef = useRef(null);
  const userRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDashboardHome = () => {
    if (!user) return '/';
    if (user.role === 'admin') return '/dashboard/admin';
    if (user.role === 'ngo') return '/dashboard/ngo';
    return '/dashboard/donor';
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="flex items-center gap-3">
          {user && onToggleSidebar && (
            <button className="navbar-hamburger" onClick={onToggleSidebar} aria-label="Toggle menu">
              ☰
            </button>
          )}

          <Link href={user ? getDashboardHome() : '/'} className="navbar-brand">
            🎁 <span>DonateEase</span>
          </Link>
        </div>

        <div className="navbar-actions">
          {!user ? (
            <>
              <Link href="/login" className="btn btn-ghost btn-sm">
                Log In
              </Link>
              <Link href="/register" className="btn btn-primary btn-sm">
                Get Started
              </Link>
            </>
          ) : (
            <>
              {/* Notification Bell */}
              <div className="relative" ref={notifRef}>
                <button
                  className="navbar-notification"
                  onClick={() => setShowNotifications(!showNotifications)}
                  aria-label="Notifications"
                >
                  🔔
                  {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                  )}
                </button>

                {showNotifications && (
                  <div className="notification-dropdown">
                    <div className="notification-dropdown-header">
                      <h4>Notifications</h4>
                      {unreadCount > 0 && (
                        <button
                          className="btn btn-ghost btn-sm text-xs"
                          onClick={() => markAllAsRead()}
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-tertiary">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`notification-item ${!n.is_read ? 'unread' : ''}`}
                          onClick={() => {
                            if (!n.is_read) markAsRead(n.id);
                          }}
                        >
                          <div>
                            <div className="notification-title">{n.title}</div>
                            <div className="notification-message">{n.message}</div>
                            <div className="notification-time">
                              {n.created_at ? new Date(n.created_at).toLocaleString() : ''}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div className="relative" ref={userRef}>
                <button
                  className="navbar-user"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <div className="avatar avatar-sm">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="navbar-user-info">
                    <div className="navbar-user-name">{user.name}</div>
                    <div className="navbar-user-role">{user.role}</div>
                  </div>
                </button>

                {showUserMenu && (
                  <div className="user-dropdown">
                    <div className="px-3 py-2 text-xs text-tertiary">
                      Signed in as <strong>{user.email}</strong>
                    </div>
                    <div className="dropdown-divider" />
                    <Link
                      href={getDashboardHome()}
                      className="dropdown-item"
                      onClick={() => setShowUserMenu(false)}
                    >
                      📊 Dashboard
                    </Link>
                    {user.role === 'ngo' && (
                      <Link
                        href="/dashboard/ngo/profile"
                        className="dropdown-item"
                        onClick={() => setShowUserMenu(false)}
                      >
                        🏢 Organization Profile
                      </Link>
                    )}
                    <div className="dropdown-divider" />
                    <button
                      className="dropdown-item text-error"
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                    >
                      🚪 Log Out
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
