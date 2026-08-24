'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  const isActive = (path) => {
    if (path === `/dashboard/${user.role}`) {
      return pathname === path;
    }
    return pathname.startsWith(path);
  };

  const donorLinks = [
    { label: 'Overview', path: '/dashboard/donor', icon: '📊' },
    { label: 'My Donations', path: '/dashboard/donor/donations', icon: '📦' },
    { label: 'Make Donation', path: '/dashboard/donor/donations/new', icon: '➕' },
    { label: 'Browse NGOs', path: '/dashboard/donor/ngos', icon: '🏢' },
  ];

  const ngoLinks = [
    { label: 'Overview', path: '/dashboard/ngo', icon: '📊' },
    { label: 'Incoming Donations', path: '/dashboard/ngo/donations', icon: '📥' },
    { label: 'Our Needs / Requests', path: '/dashboard/ngo/requests', icon: '📣' },
    { label: 'Organization Profile', path: '/dashboard/ngo/profile', icon: '🏢' },
  ];

  const adminLinks = [
    { label: 'Analytics Overview', path: '/dashboard/admin', icon: '📈' },
    { label: 'User Management', path: '/dashboard/admin/users', icon: '👥' },
    { label: 'NGO Verifications', path: '/dashboard/admin/organizations', icon: '🛡️' },
    { label: 'Complaints & Disputes', path: '/dashboard/admin/complaints', icon: '⚠️' },
    { label: 'Categories & Items', path: '/dashboard/admin/categories', icon: '🏷️' },
  ];

  let links = donorLinks;
  if (user.role === 'ngo') links = ngoLinks;
  if (user.role === 'admin') links = adminLinks;

  return (
    <aside className={`dashboard-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-section">
        <div className="sidebar-section-label font-semibold">
          {user.role === 'donor' && 'Donor Portal'}
          {user.role === 'ngo' && 'NGO Portal'}
          {user.role === 'admin' && 'Admin Control'}
        </div>
        {links.map((link) => (
          <Link
            key={link.path}
            href={link.path}
            className={`sidebar-link ${isActive(link.path) ? 'active' : ''}`}
            onClick={onClose}
          >
            <span className="sidebar-link-icon">{link.icon}</span>
            <span>{link.label}</span>
          </Link>
        ))}
      </div>

      <div className="sidebar-section mt-auto">
        <div className="sidebar-section-label">Account</div>
        <div className="p-3 bg-gray-50 rounded-lg text-xs">
          <div className="font-semibold text-primary mb-1">{user.name}</div>
          <div className="text-tertiary capitalize">{user.role} Account</div>
          {user.city && <div className="text-tertiary mt-1">📍 {user.city}</div>}
        </div>
      </div>
    </aside>
  );
}
