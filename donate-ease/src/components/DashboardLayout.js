'use client';

import { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardLayout({ children, allowedRoles = [] }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    } else if (!isLoading && user && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      // Redirect to user's home dashboard if role not allowed
      router.push(`/dashboard/${user.role}`);
    }
  }, [isLoading, user, allowedRoles, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="spinner spinner-lg mx-auto mb-4" />
          <p className="text-sm text-secondary">Loading your portal...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div>
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="dashboard-wrapper">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="dashboard-content">
          {children}
        </main>
      </div>
    </div>
  );
}
